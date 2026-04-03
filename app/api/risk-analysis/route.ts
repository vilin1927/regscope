import { NextResponse } from "next/server";
import { isRateLimited, callOpenAI } from "@/lib/api-helpers";
import { requireAuth } from "@/lib/db/auth-checks";
import { db } from "@/lib/db";
import { scans, riskReports } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { RiskItem } from "@/types/addons";

// Allow up to 60s for OpenAI generation
export const maxDuration = 60;

const VALID_SEVERITIES = ["kritisch", "hoch", "mittel", "niedrig"];

export async function POST(request: Request) {
  try {
    // Auth (required — no guests)
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
      return NextResponse.json(
        { error: "Scan-ID fehlt" },
        { status: 400 }
      );
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
        .delete(riskReports)
        .where(and(eq(riskReports.scanId, scanId), eq(riskReports.userId, userId)));
    } else {
      // Check for existing report (cache-first)
      const [existing] = await db
        .select({
          id: riskReports.id,
          report: riskReports.report,
          status: riskReports.status,
          createdAt: riskReports.createdAt,
        })
        .from(riskReports)
        .where(and(eq(riskReports.scanId, scanId), eq(riskReports.userId, userId)))
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
          .delete(riskReports)
          .where(eq(riskReports.id, existing.id));
      }

      // checkOnly mode: just checking for cache, don't generate
      if (checkOnly) {
        return NextResponse.json({ report: null, cached: false });
      }
    }

    // Filter to non-compliant regulations
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

    // Prioritize "fehlend" over "pruefung", cap at 5 to stay within Vercel 60s limit
    const sorted = [...allNonCompliant].sort((a, b) =>
      a.status === "fehlend" && b.status !== "fehlend" ? -1 : 0
    );
    const regulations = sorted.slice(0, 5).map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      status: r.status,
      riskLevel: r.riskLevel,
    }));

    // Insert placeholder with 'generating' status
    let placeholder: { id: string };
    try {
      const [inserted] = await db
        .insert(riskReports)
        .values({
          scanId,
          userId,
          report: {},
          status: "generating",
        })
        .returning({ id: riskReports.id });
      placeholder = inserted;
    } catch {
      // Race condition: another request already started generating (unique constraint)
      return NextResponse.json({
        report: null,
        cached: false,
        status: "generating",
      });
    }

    // Generate risk analysis via OpenAI — keep prompt concise for speed
    const systemPrompt = `Compliance-Risikoanalyst für deutsche Handwerksbetriebe. Antworte NUR mit JSON:
{"items":[{"regulationId":"ID","regulationName":"Name","severity":"kritisch|hoch|mittel|niedrig","complianceGap":"1 Satz","deadline":"z.B. Sofort oder Q2 2026","potentialPenalty":"Betrag","mitigation":"1 Satz"}],"summary":"1-2 Sätze"}
Sortiere: kritisch>hoch>mittel>niedrig. Verwende nur IDs aus der Liste. Kurz und präzise antworten.`;

    // Compact business profile — only essential fields
    const bp = scan.businessProfile as Record<string, unknown> | null;
    const compactProfile = bp ? {
      companyName: bp.companyName,
      trade: bp.trade,
      employees: bp.employees,
      state: bp.state,
    } : {};

    const userPrompt = `Profil: ${JSON.stringify(compactProfile)}
Vorschriften (${allNonCompliant.length} gesamt, Top ${regulations.length}): ${JSON.stringify(regulations)}`;

    const { content, error: aiError } = await callOpenAI(
      systemPrompt,
      userPrompt,
      undefined,
      3000 // cap response to ~3000 tokens
    );

    if (aiError) {
      // Clean up placeholder on failure
      await db.delete(riskReports).where(eq(riskReports.id, placeholder.id));
      return NextResponse.json({ error: aiError }, { status: 502 });
    }

    let parsed: { items?: unknown[]; summary?: string };
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error("Failed to parse risk analysis response:", content.slice(0, 200));
      await db.delete(riskReports).where(eq(riskReports.id, placeholder.id));
      return NextResponse.json(
        { error: "Ungültiges Antwortformat von der KI" },
        { status: 502 }
      );
    }

    // Validate items
    if (!parsed.items || !Array.isArray(parsed.items)) {
      await db.delete(riskReports).where(eq(riskReports.id, placeholder.id));
      return NextResponse.json(
        { error: "Ungültiges Risikoanalyse-Format" },
        { status: 502 }
      );
    }

    const regIds = new Set(regulations.map((r) => String(r.id)));
    const validItems: RiskItem[] = parsed.items
      .filter((item) => {
        const i = item as Record<string, unknown>;
        return (
          typeof i.regulationId === "string" &&
          regIds.has(i.regulationId) &&
          typeof i.severity === "string" &&
          VALID_SEVERITIES.includes(i.severity)
        );
      })
      .map((item) => {
        const i = item as Record<string, unknown>;
        return {
          regulationId: i.regulationId as string,
          regulationName: (i.regulationName as string) || "",
          severity: i.severity as RiskItem["severity"],
          complianceGap: (i.complianceGap as string) || "",
          deadline: (i.deadline as string) || "",
          potentialPenalty: (i.potentialPenalty as string) || "",
          mitigation: (i.mitigation as string) || "",
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
        .update(riskReports)
        .set({ report, status: "complete" })
        .where(eq(riskReports.id, placeholder.id))
        .returning({ id: riskReports.id, createdAt: riskReports.createdAt });
      if (updated) {
        updatedId = updated.id;
        updatedCreatedAt = updated.createdAt?.toISOString() || updatedCreatedAt;
      }
    } catch (updateError) {
      console.error("Failed to store risk report:", updateError);
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
    console.error("Risk analysis API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Interner Serverfehler",
      },
      { status: 500 }
    );
  }
}
