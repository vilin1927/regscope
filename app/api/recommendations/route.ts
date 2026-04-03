import { NextResponse } from "next/server";
import { isRateLimited, callOpenAI } from "@/lib/api-helpers";
import { requireAuth } from "@/lib/db/auth-checks";
import { db } from "@/lib/db";
import { scans, riskReports, recommendations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { RecommendationItem } from "@/types/addons";

// Allow up to 60s for OpenAI generation
export const maxDuration = 60;

const VALID_TIMELINES = ["sofort", "kurzfristig", "geplant"];
const VALID_TYPES = ["action", "insurance"];

export async function POST(request: Request) {
  try {
    // Auth (required)
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    // Parse body
    let body: { scanId?: string; force?: boolean; checkOnly?: boolean };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Ungültiges JSON im Anfragekörper" },
        { status: 400 }
      );
    }

    const { scanId, force, checkOnly } = body;

    // Rate limiting — skip for cheap cache checks (checkOnly)
    if (!checkOnly) {
      const ip =
        request.headers.get("x-forwarded-for") ??
        request.headers.get("x-real-ip") ??
        "unknown";
      if (isRateLimited(ip)) {
        return NextResponse.json(
          { error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut." },
          { status: 429 }
        );
      }
    }
    if (!scanId) {
      return NextResponse.json({ error: "Scan-ID fehlt" }, { status: 400 });
    }

    // Verify scan ownership
    const [scan] = await db
      .select({
        id: scans.id,
        matchedRegulations: scans.matchedRegulations,
        businessProfile: scans.businessProfile,
      })
      .from(scans)
      .where(and(eq(scans.id, scanId), eq(scans.userId, userId)))
      .limit(1);

    if (!scan) {
      return NextResponse.json(
        { error: "Scan nicht gefunden oder Zugriff verweigert" },
        { status: 404 }
      );
    }

    // Delete existing report when force re-run
    if (force) {
      await db
        .delete(recommendations)
        .where(and(eq(recommendations.scanId, scanId), eq(recommendations.userId, userId)));
    } else {
      // Check for existing report (cache-first)
      const [existing] = await db
        .select({
          id: recommendations.id,
          report: recommendations.report,
          status: recommendations.status,
          createdAt: recommendations.createdAt,
        })
        .from(recommendations)
        .where(and(eq(recommendations.scanId, scanId), eq(recommendations.userId, userId)))
        .limit(1);

      if (existing) {
        // Completed report — return cached
        if (existing.status === "complete") {
          return NextResponse.json({
            report: {
              id: existing.id,
              scanId,
              ...(existing.report as Record<string, unknown>),
              createdAt: existing.createdAt?.toISOString(),
            },
            cached: true,
          });
        }

        // Still generating — check if stale (>2 minutes)
        const age = Date.now() - new Date(existing.createdAt!).getTime();
        if (age < 2 * 60 * 1000) {
          return NextResponse.json({
            report: null,
            cached: false,
            status: "generating",
          });
        }

        // Stale generating row — delete and regenerate
        await db
          .delete(recommendations)
          .where(eq(recommendations.id, existing.id));
      }

      // checkOnly mode: just checking for cache, don't generate
      if (checkOnly) {
        return NextResponse.json({ report: null, cached: false });
      }
    }

    // Optionally read risk report for enrichment
    const [riskReport] = await db
      .select({ report: riskReports.report })
      .from(riskReports)
      .where(and(eq(riskReports.scanId, scanId), eq(riskReports.userId, userId)))
      .limit(1);

    const matchedRegs = (scan.matchedRegulations || []) as Array<Record<string, unknown>>;
    const allNonCompliant = matchedRegs.filter(
      (r) => r.status === "fehlend" || r.status === "pruefung"
    );

    if (allNonCompliant.length === 0) {
      return NextResponse.json(
        { error: "Keine Compliance-Lücken gefunden — alle Vorschriften erfüllt" },
        { status: 400 }
      );
    }

    // Prioritize "fehlend" over "pruefung", cap at 10 to stay within timeout
    const sorted = [...allNonCompliant].sort((a, b) =>
      a.status === "fehlend" && b.status !== "fehlend" ? -1 : 0
    );
    const nonCompliant = sorted.slice(0, 10).map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      status: r.status,
      riskLevel: r.riskLevel,
      summary: typeof r.summary === "string" ? (r.summary as string).slice(0, 150) : "",
    }));

    // Insert placeholder with 'generating' status
    let placeholder: { id: string };
    try {
      const [inserted] = await db
        .insert(recommendations)
        .values({
          scanId,
          userId,
          report: {},
          status: "generating",
        })
        .returning({ id: recommendations.id });
      placeholder = inserted;
    } catch {
      // Race condition: another request already started generating (unique constraint)
      return NextResponse.json({
        report: null,
        cached: false,
        status: "generating",
      });
    }

    const riskContext = riskReport?.report
      ? `\n\n## Risikoanalyse (bereits erstellt)\n${JSON.stringify(riskReport.report, null, 2)}`
      : "";

    const systemPrompt = `Du bist ein erfahrener Compliance-Berater für deutsche Handwerksbetriebe.

Du erhältst Vorschriften mit Compliance-Lücken, das Unternehmensprofil und ggf. eine vorhandene Risikoanalyse.

Erstelle priorisierte Handlungsempfehlungen im JSON-Format:
{
  "items": [
    {
      "priority": 1,
      "title": "<Kurzer Titel der Maßnahme>",
      "description": "<Detaillierte Beschreibung, was zu tun ist, 2-3 Sätze>",
      "timeline": "<sofort|kurzfristig|geplant>",
      "type": "<action|insurance>",
      "regulationId": "<ID der betroffenen Vorschrift>",
      "regulationName": "<Name der Vorschrift>"
    }
  ],
  "summary": "<Zusammenfassung in 2-3 Sätzen>"
}

Regeln:
- Priorität 1-5 (1 = höchste Priorität)
- "sofort" = innerhalb 2 Wochen (kritische Sicherheitsrisiken, hohe Bußgelder)
- "kurzfristig" = innerhalb 3 Monaten
- "geplant" = innerhalb 6-12 Monaten
- "action" = Compliance-Maßnahme (z.B. Dokument erstellen, Schulung durchführen)
- "insurance" = Versicherungsempfehlung (z.B. Betriebshaftpflicht abschließen)
- Sortiere nach Priorität (1 zuerst)
- Maßnahmen sollen konkret, praktisch und für einen Handwerksbetrieb umsetzbar sein
- Wenn Risikoanalyse vorhanden: nutze die Schweregrade und Fristen daraus`;

    // Compact business profile — only essential fields
    const bp = scan.businessProfile as Record<string, unknown> | null;
    const compactProfile = bp ? {
      companyName: bp.companyName,
      trade: bp.trade,
      employees: bp.employees,
      state: bp.state,
    } : {};

    // Truncate risk context if too long
    const riskContextTruncated = riskContext.length > 1500
      ? riskContext.slice(0, 1500) + "\n...(gekürzt)"
      : riskContext;

    const userPrompt = `## Unternehmensprofil
${JSON.stringify(compactProfile)}

## Vorschriften mit Compliance-Lücken (${allNonCompliant.length} gesamt, Top ${nonCompliant.length})
${JSON.stringify(nonCompliant)}${riskContextTruncated}`;

    const { content, error: aiError } = await callOpenAI(
      systemPrompt,
      userPrompt,
      undefined,
      3000 // cap response to ~3000 tokens
    );

    if (aiError) {
      await db.delete(recommendations).where(eq(recommendations.id, placeholder.id));
      return NextResponse.json({ error: aiError }, { status: 502 });
    }

    let parsed: { items?: unknown[]; summary?: string };
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error(
        "Failed to parse recommendations response:",
        content.slice(0, 200)
      );
      await db.delete(recommendations).where(eq(recommendations.id, placeholder.id));
      return NextResponse.json(
        { error: "Ungültiges Antwortformat von der KI" },
        { status: 502 }
      );
    }

    if (!parsed.items || !Array.isArray(parsed.items)) {
      await db.delete(recommendations).where(eq(recommendations.id, placeholder.id));
      return NextResponse.json(
        { error: "Ungültiges Empfehlungsformat" },
        { status: 502 }
      );
    }

    const validItems: RecommendationItem[] = parsed.items
      .filter((item) => {
        const i = item as Record<string, unknown>;
        return (
          typeof i.title === "string" &&
          typeof i.timeline === "string" &&
          VALID_TIMELINES.includes(i.timeline) &&
          typeof i.type === "string" &&
          VALID_TYPES.includes(i.type)
        );
      })
      .map((item) => {
        const i = item as Record<string, unknown>;
        return {
          priority: typeof i.priority === "number" ? i.priority : 5,
          title: i.title as string,
          description: (i.description as string) || "",
          timeline: i.timeline as RecommendationItem["timeline"],
          type: i.type as RecommendationItem["type"],
          regulationId: (i.regulationId as string) || undefined,
          regulationName: (i.regulationName as string) || undefined,
        };
      });

    const report = {
      items: validItems,
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
    };

    // Update placeholder with completed report
    let updatedId = placeholder.id;
    let updatedCreatedAt = new Date().toISOString();
    try {
      const [updated] = await db
        .update(recommendations)
        .set({ report, status: "complete" })
        .where(eq(recommendations.id, placeholder.id))
        .returning({ id: recommendations.id, createdAt: recommendations.createdAt });
      if (updated) {
        updatedId = updated.id;
        updatedCreatedAt = updated.createdAt?.toISOString() || updatedCreatedAt;
      }
    } catch (updateError) {
      console.error("Failed to store recommendations:", updateError);
    }

    return NextResponse.json({
      report: {
        id: updatedId,
        scanId,
        ...report,
        createdAt: updatedCreatedAt,
      },
      cached: false,
    });
  } catch (error) {
    console.error("Recommendations API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Interner Serverfehler",
      },
      { status: 500 }
    );
  }
}
