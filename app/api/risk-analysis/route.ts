import { NextResponse } from "next/server";
import {
  isRateLimited,
  createSupabaseServerClient,
  requireAuth,
  callOpenAI,
} from "@/lib/api-helpers";
import type { RiskItem } from "@/types/addons";

// Allow up to 60s for OpenAI generation
export const maxDuration = 60;

const VALID_SEVERITIES = ["kritisch", "hoch", "mittel", "niedrig"];

export async function POST(request: Request) {
  try {
    // Auth (required — no guests)
    const supabase = await createSupabaseServerClient();
    const { userId, error: authError } = await requireAuth(supabase);
    if (!userId) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    // Parse body
    let body: { scanId?: string; force?: boolean; checkOnly?: boolean };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
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
          { error: "Too many requests. Please try again later." },
          { status: 429 }
        );
      }
    }
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
        .select("id, report, status, created_at")
        .eq("scan_id", scanId)
        .eq("user_id", userId)
        .single();

      if (existing) {
        // Completed report — return cached
        if (existing.status === "complete") {
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

        // Still generating — check if stale (>2 minutes)
        const age = Date.now() - new Date(existing.created_at).getTime();
        if (age < 2 * 60 * 1000) {
          return NextResponse.json({
            report: null,
            cached: false,
            status: "generating",
          });
        }

        // Stale generating row — delete and regenerate
        await supabase
          .from("risk_reports")
          .delete()
          .eq("id", existing.id);
      }

      // checkOnly mode: just checking for cache, don't generate
      if (checkOnly) {
        return NextResponse.json({ report: null, cached: false });
      }
    }

    // Filter to non-compliant regulations
    const allNonCompliant = (scan.matched_regulations || []).filter(
      (r: { status: string }) =>
        r.status === "fehlend" || r.status === "pruefung"
    );

    if (allNonCompliant.length === 0) {
      return NextResponse.json(
        { error: "No compliance gaps found — all regulations fulfilled" },
        { status: 400 }
      );
    }

    // Prioritize "fehlend" over "pruefung", cap at 5 to stay within Vercel 60s limit
    // (tested: 5 regs = ~13s OpenAI, 10 regs = ~30-40s — too risky with cold start)
    const sorted = [...allNonCompliant].sort((a: { status: string }, b: { status: string }) =>
      a.status === "fehlend" && b.status !== "fehlend" ? -1 : 0
    );
    const regulations = sorted.slice(0, 5).map((r: Record<string, unknown>) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      status: r.status,
      riskLevel: r.riskLevel,
    }));

    // Insert placeholder with 'generating' status
    const { data: placeholder, error: placeholderError } = await supabase
      .from("risk_reports")
      .insert({
        scan_id: scanId,
        user_id: userId,
        report: {},
        status: "generating",
      })
      .select("id")
      .single();

    if (placeholderError) {
      // Race condition: another request already started generating
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
    const bp = scan.business_profile as Record<string, unknown> | null;
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
      await supabase.from("risk_reports").delete().eq("id", placeholder.id);
      return NextResponse.json({ error: aiError }, { status: 502 });
    }

    let parsed: { items?: unknown[]; summary?: string };
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error("Failed to parse risk analysis response:", content.slice(0, 200));
      await supabase.from("risk_reports").delete().eq("id", placeholder.id);
      return NextResponse.json(
        { error: "Invalid response format from AI" },
        { status: 502 }
      );
    }

    // Validate items
    if (!parsed.items || !Array.isArray(parsed.items)) {
      await supabase.from("risk_reports").delete().eq("id", placeholder.id);
      return NextResponse.json(
        { error: "Invalid risk analysis format" },
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
    const { data: updated, error: updateError } = await supabase
      .from("risk_reports")
      .update({
        report,
        status: "complete",
      })
      .eq("id", placeholder.id)
      .select("id, created_at")
      .single();

    if (updateError) {
      console.error("Failed to store risk report:", updateError);
    }

    return NextResponse.json({
      report: {
        id: updated?.id || placeholder.id,
        scanId,
        ...report,
        createdAt: updated?.created_at || new Date().toISOString(),
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
