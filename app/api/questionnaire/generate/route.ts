import { NextRequest, NextResponse } from "next/server";
import { isRateLimited, createSupabaseServerClient } from "@/lib/api-helpers";
import { classifyIndustry } from "@/lib/industry-detector";
import { generateQuestionnaire } from "@/data/questionnaire/dynamic-generator";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte warten Sie eine Minute." },
      { status: 429 }
    );
  }

  let body: { gegenstand: string; companyName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }

  const { gegenstand, companyName } = body;

  if (!gegenstand || gegenstand.length < 10) {
    return NextResponse.json(
      { error: "Unternehmensgegenstand ist zu kurz oder fehlt." },
      { status: 400 }
    );
  }

  try {
    // Step 1: Classify industry
    const classification = await classifyIndustry(gegenstand, companyName);

    // Step 2: Check cache in Supabase (gracefully handle missing table)
    let cached: { questions: unknown; usage_count?: number } | null = null;
    try {
      const supabase = await createSupabaseServerClient();
      const { data } = await supabase
        .from("industry_templates")
        .select("questions, usage_count")
        .eq("industry_code", classification.industry_code)
        .single();
      cached = data;
    } catch {
      // Table may not exist yet — skip cache
    }

    if (cached?.questions) {
      // Try to increment usage count in background
      try {
        const supabase = await createSupabaseServerClient();
        supabase
          .from("industry_templates")
          .update({ usage_count: (cached.usage_count || 0) + 1 })
          .eq("industry_code", classification.industry_code)
          .then(() => {});
      } catch { /* ignore */ }

      return NextResponse.json({
        layers: cached.questions,
        classification,
        cached: true,
      });
    }

    // Step 3: Generate new questionnaire via AI
    const layers = await generateQuestionnaire(
      gegenstand,
      classification.industry_code,
      classification.industry_label_de
    );

    // Step 4: Cache the generated template (non-blocking, graceful)
    try {
      const supabase = await createSupabaseServerClient();
      supabase
        .from("industry_templates")
        .upsert({
          industry_code: classification.industry_code,
          industry_label: classification.industry_label_de,
          questions: layers,
          gegenstand_sample: gegenstand.substring(0, 500),
          usage_count: 1,
        })
        .then(() => {});
    } catch { /* table may not exist yet */ }

    return NextResponse.json({
      layers,
      classification,
      cached: false,
    });
  } catch (err) {
    console.error("Questionnaire generation error:", err);
    const message = err instanceof Error ? err.message : "Fragebogen konnte nicht erstellt werden";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
