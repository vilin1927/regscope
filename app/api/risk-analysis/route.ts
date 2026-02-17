import { NextResponse } from "next/server";
import {
  isRateLimited,
  createSupabaseServerClient,
  requireAuth,
  callOpenAI,
} from "@/lib/api-helpers";
import type { RiskItem } from "@/types/addons";

const VALID_SEVERITIES = ["kritisch", "hoch", "mittel", "niedrig"];

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

    // Auth (required — no guests)
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
      return NextResponse.json(
        { error: "Missing scanId" },
        { status: 400 }
      );
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
        .from("risk_reports")
        .delete()
        .eq("scan_id", scanId)
        .eq("user_id", userId);
    } else {
      // Check for existing report (cache-first)
      const { data: existing } = await supabase
        .from("risk_reports")
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

    // Filter to non-compliant regulations
    const regulations = (scan.matched_regulations || []).filter(
      (r: { status: string }) =>
        r.status === "fehlend" || r.status === "pruefung"
    );

    if (regulations.length === 0) {
      return NextResponse.json(
        { error: "No compliance gaps found — all regulations fulfilled" },
        { status: 400 }
      );
    }

    // Generate risk analysis via OpenAI
    const systemPrompt = `Du bist ein erfahrener Compliance-Risikoanalyst für deutsche Handwerksbetriebe.

Du erhältst eine Liste von Vorschriften, bei denen ein Betrieb Compliance-Lücken hat (Status "fehlend" oder "pruefung"), zusammen mit dem Unternehmensprofil.

Erstelle eine detaillierte Risikoanalyse im JSON-Format:
{
  "items": [
    {
      "regulationId": "<ID der Vorschrift>",
      "regulationName": "<Name der Vorschrift>",
      "severity": "<kritisch|hoch|mittel|niedrig>",
      "complianceGap": "<Konkrete Beschreibung der Lücke, 1-2 Sätze>",
      "deadline": "<Realistische Frist, z.B. 'Q2 2026' oder 'Sofort'>",
      "potentialPenalty": "<Mögliche Sanktion mit Betrag>",
      "mitigation": "<Konkrete Maßnahme zur Behebung, 1-2 Sätze>"
    }
  ],
  "summary": "<Zusammenfassung der Risikolage in 2-3 Sätzen>"
}

Regeln:
- Sortiere nach Schweregrad: kritisch > hoch > mittel > niedrig
- "kritisch" = unmittelbare Gefahr für Mitarbeiter oder hohe Bußgelder (>10.000€)
- "hoch" = gesetzliche Pflicht verletzt, mittlere Bußgelder
- "mittel" = Prüfungsbedarf, geringes Bußgeldrisiko
- "niedrig" = Empfehlung, kein unmittelbares Bußgeldrisiko
- Verwende nur IDs aus der übergebenen Liste
- Fristen sollen realistisch für einen Handwerksbetrieb sein
- Maßnahmen sollen praktisch und umsetzbar sein`;

    const userPrompt = `## Unternehmensprofil
${JSON.stringify(scan.business_profile, null, 2)}

## Vorschriften mit Compliance-Lücken
${JSON.stringify(regulations, null, 2)}`;

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
      console.error("Failed to parse risk analysis response:", content.slice(0, 200));
      return NextResponse.json(
        { error: "Invalid response format from AI" },
        { status: 502 }
      );
    }

    // Validate items
    if (!parsed.items || !Array.isArray(parsed.items)) {
      return NextResponse.json(
        { error: "Invalid risk analysis format" },
        { status: 502 }
      );
    }

    const regIds = new Set(regulations.map((r: { id: string }) => r.id));
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

    // Store in Supabase
    const { data: inserted, error: insertError } = await supabase
      .from("risk_reports")
      .insert({
        scan_id: scanId,
        user_id: userId,
        report,
      })
      .select("id, created_at")
      .single();

    if (insertError) {
      console.error("Failed to store risk report:", insertError);
      // Still return the report even if storage fails
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
    console.error("Risk analysis API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
