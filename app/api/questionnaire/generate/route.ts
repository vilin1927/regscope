import { NextRequest, NextResponse } from "next/server";
import { isRateLimited } from "@/lib/api-helpers";
import { classifyIndustry } from "@/lib/industry-detector";
import { generateQuestionnaire } from "@/data/questionnaire/dynamic-generator";
import { db } from "@/lib/db";
import { industryTemplates } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

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

    // Step 2: Check cache in database (gracefully handle errors)
    let cached: { questions: unknown; usageCount: number } | null = null;
    try {
      const [row] = await db
        .select({
          questions: industryTemplates.questions,
          usageCount: industryTemplates.usageCount,
        })
        .from(industryTemplates)
        .where(eq(industryTemplates.industryCode, classification.industry_code))
        .limit(1);
      cached = row || null;
    } catch {
      // Table may not exist yet — skip cache
    }

    if (cached?.questions) {
      // Increment usage count in background (fire-and-forget)
      try {
        db.update(industryTemplates)
          .set({ usageCount: sql`${industryTemplates.usageCount} + 1` })
          .where(eq(industryTemplates.industryCode, classification.industry_code))
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
      db.insert(industryTemplates)
        .values({
          industryCode: classification.industry_code,
          industryLabel: classification.industry_label_de,
          questions: layers,
          gegenstandSample: gegenstand.substring(0, 500),
          usageCount: 1,
        })
        .onConflictDoUpdate({
          target: industryTemplates.industryCode,
          set: {
            questions: layers,
            gegenstandSample: gegenstand.substring(0, 500),
            usageCount: sql`${industryTemplates.usageCount} + 1`,
            updatedAt: new Date(),
          },
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
