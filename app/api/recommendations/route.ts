import { NextResponse } from "next/server";
import {
  isRateLimited,
  createSupabaseServerClient,
  requireAuth,
  callOpenAI,
} from "@/lib/api-helpers";
import type { RecommendationItem } from "@/types/addons";

const VALID_TIMELINES = ["sofort", "kurzfristig", "geplant"];
const VALID_TYPES = ["action", "insurance"];

export async function POST(request: Request) {
  try {
    // Rate limiting
    const ip =
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Auth (required)
    const supabase = await createSupabaseServerClient();
    const { userId, error: authError } = await requireAuth(supabase);
    if (!userId) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    // Parse body
    let body: { scanId?: string; force?: boolean };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { scanId, force } = body;
    if (!scanId) {
      return NextResponse.json({ error: "Missing scanId" }, { status: 400 });
    }

    // Verify scan ownership
    const { data: scan, error: scanError } = await supabase
      .from("scans")
      .select("id, matched_regulations, business_profile")
      .eq("id", scanId)
      .eq("user_id", userId)
      .single();

    if (scanError || !scan) {
      return NextResponse.json(
        { error: "Scan not found or access denied" },
        { status: 404 }
      );
    }

    // Delete existing report when force re-run
    if (force) {
      await supabase
        .from("recommendations")
        .delete()
        .eq("scan_id", scanId)
        .eq("user_id", userId);
    } else {
      // Check for existing report (cache-first)
      const { data: existing } = await supabase
        .from("recommendations")
        .select("id, report, created_at")
        .eq("scan_id", scanId)
        .eq("user_id", userId)
        .single();

      if (existing) {
        return NextResponse.json({
          report: {
            id: existing.id,
            scanId,
            ...existing.report,
            createdAt: existing.created_at,
          },
          cached: true,
        });
      }
    }

    // Optionally read risk report for enrichment
    const { data: riskReport } = await supabase
      .from("risk_reports")
      .select("report")
      .eq("scan_id", scanId)
      .eq("user_id", userId)
      .single();

    const regulations = scan.matched_regulations || [];
    const nonCompliant = regulations.filter(
      (r: { status: string }) =>
        r.status === "fehlend" || r.status === "pruefung"
    );

    if (nonCompliant.length === 0) {
      return NextResponse.json(
        { error: "No compliance gaps found — all regulations fulfilled" },
        { status: 400 }
      );
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

    const userPrompt = `## Unternehmensprofil
${JSON.stringify(scan.business_profile, null, 2)}

## Vorschriften mit Compliance-Lücken
${JSON.stringify(nonCompliant, null, 2)}${riskContext}`;

    const { content, error: aiError } = await callOpenAI(
      systemPrompt,
      userPrompt
    );

    if (aiError) {
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
      return NextResponse.json(
        { error: "Invalid response format from AI" },
        { status: 502 }
      );
    }

    if (!parsed.items || !Array.isArray(parsed.items)) {
      return NextResponse.json(
        { error: "Invalid recommendations format" },
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

    // Store in Supabase
    const { data: inserted, error: insertError } = await supabase
      .from("recommendations")
      .insert({
        scan_id: scanId,
        user_id: userId,
        report,
      })
      .select("id, created_at")
      .single();

    if (insertError) {
      console.error("Failed to store recommendations:", insertError);
    }

    return NextResponse.json({
      report: {
        id: inserted?.id || "temp",
        scanId,
        ...report,
        createdAt: inserted?.created_at || new Date().toISOString(),
      },
      cached: false,
    });
  } catch (error) {
    console.error("Recommendations API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
