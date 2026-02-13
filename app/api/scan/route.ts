import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { carpentryRegulations } from "@/data/regulations/carpentry-regulations";
import type {
  Regulation,
  MatchedRegulation,
  ComplianceStatus,
  Jurisdiction,
  RegulationCategory,
  RiskLevel,
} from "@/data/regulations/types";

// Simple in-memory rate limiter (per-IP, resets on cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // max requests
const RATE_WINDOW = 60_000; // per 60 seconds

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

// Compact regulations for the prompt — strip matching-engine fields the AI doesn't need
function compactRegulations(regulations: Regulation[]) {
  return regulations.map((r) => ({
    id: r.id,
    name: r.name,
    officialReference: r.officialReference,
    jurisdiction: r.jurisdiction,
    category: r.category,
    summary: r.summary,
    keyRequirements: r.keyRequirements,
    potentialPenalty: r.potentialPenalty,
    riskLevel: r.riskLevel,
    sourceUrl: r.sourceUrl,
    niche: r.niche,
  }));
}

const VALID_JURISDICTIONS: Jurisdiction[] = ["eu", "bund", "land", "branche"];
const VALID_CATEGORIES: RegulationCategory[] = [
  "arbeitssicherheit",
  "arbeitsrecht",
  "gewerberecht",
  "umweltrecht",
  "produktsicherheit",
  "datenschutz",
  "versicherungspflichten",
];
const VALID_RISK_LEVELS: RiskLevel[] = ["hoch", "mittel", "niedrig"];
const VALID_STATUSES: ComplianceStatus[] = ["erfuellt", "pruefung", "fehlend"];

const REQUIRED_PROFILE_FIELDS = [
  "industry",
  "employeeCount",
];

function validateResponse(
  parsed: unknown,
  regulationMap: Map<string, Regulation>
): MatchedRegulation[] {
  const data = parsed as { regulations?: unknown[] };
  if (!data.regulations || !Array.isArray(data.regulations)) {
    throw new Error("Response missing 'regulations' array");
  }

  const results: MatchedRegulation[] = [];

  for (const item of data.regulations) {
    const r = item as Record<string, unknown>;
    const id = r.id as string;

    const sourceReg = regulationMap.get(id);
    if (!sourceReg) continue; // Skip unknown regulation IDs

    const status = r.status as ComplianceStatus;
    if (!VALID_STATUSES.includes(status)) continue;

    // Validate enum fields from AI response, fallback to source data
    const jurisdiction = VALID_JURISDICTIONS.includes(r.jurisdiction as Jurisdiction)
      ? (r.jurisdiction as Jurisdiction)
      : sourceReg.jurisdiction;
    const category = VALID_CATEGORIES.includes(r.category as RegulationCategory)
      ? (r.category as RegulationCategory)
      : sourceReg.category;
    const riskLevel = VALID_RISK_LEVELS.includes(r.riskLevel as RiskLevel)
      ? (r.riskLevel as RiskLevel)
      : sourceReg.riskLevel;

    results.push({
      ...sourceReg,
      jurisdiction,
      category,
      riskLevel,
      status,
      whyApplies: typeof r.whyApplies === "string" ? r.whyApplies : sourceReg.whyAppliesTemplate,
    });
  }

  return results;
}

export async function POST(request: Request) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Auth check — allow both authenticated users and guests
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );
    const { data: { session } } = await supabase.auth.getSession();
    // Allow guests (no session) but log for monitoring
    const userId = session?.user?.id ?? "guest";
    console.info(`Scan request from user: ${userId}`);

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || "gpt-4o";

    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    let body: { profile?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { profile } = body;

    if (!profile || typeof profile !== "object") {
      return NextResponse.json(
        { error: "Missing business profile" },
        { status: 400 }
      );
    }

    // Validate required fields exist
    const profileObj = profile as Record<string, unknown>;
    const missingFields = REQUIRED_PROFILE_FIELDS.filter((f) => !profileObj[f]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    const compactRegs = compactRegulations(carpentryRegulations);
    const regulationMap = new Map<string, Regulation>(
      carpentryRegulations.map((r) => [r.id, r])
    );

    const systemPrompt = `Du bist ein erfahrener deutscher Rechtsberater für Handwerksbetriebe, spezialisiert auf regulatorische Compliance im Tischler- und Schreinerhandwerk.

Du erhältst:
1. Ein Unternehmensprofil (Betriebsdaten aus einem Fragebogen)
2. Eine Referenzdatenbank mit 37 deutschen Vorschriften, die für Tischlereien relevant sein können

Deine Aufgabe:
- Analysiere das Unternehmensprofil und bestimme, welche der 37 Vorschriften auf diesen konkreten Betrieb zutreffen
- Setze für jede zutreffende Vorschrift einen Compliance-Status basierend auf den Antworten im Profil:
  - "erfuellt": Der Betrieb hat die entsprechenden Maßnahmen getroffen (relevante Felder sind true/positiv)
  - "fehlend": Der Betrieb hat die Maßnahmen NICHT getroffen (relevante Felder sind false/negativ)
  - "pruefung": Nicht genügend Information oder Status unklar
- Schreibe für jede zutreffende Vorschrift einen personalisierten "whyApplies"-Text (2-3 Sätze auf Deutsch), der erklärt, WARUM genau diese Vorschrift für diesen konkreten Betrieb gilt. Beziehe dich dabei auf die konkreten Betriebsdaten (Mitarbeiterzahl, Branche, Produkte etc.)

Antworte ausschließlich im folgenden JSON-Format:
{
  "regulations": [
    {
      "id": "<regulation id from reference database>",
      "jurisdiction": "<eu|bund|land|branche>",
      "category": "<category from reference database>",
      "riskLevel": "<hoch|mittel|niedrig>",
      "status": "<erfuellt|pruefung|fehlend>",
      "whyApplies": "<personalisierter Erklärungstext auf Deutsch>"
    }
  ]
}

Wichtig:
- Gib NUR Vorschriften zurück, die auf diesen Betrieb zutreffen
- Verwende nur IDs aus der Referenzdatenbank
- Sortiere nach Risikolevel: hoch zuerst, dann mittel, dann niedrig
- Die whyApplies-Texte sollen konkret und hilfreich sein, nicht generisch`;

    const userPrompt = `## Unternehmensprofil

${JSON.stringify(profile, null, 2)}

## Referenz-Vorschriftendatenbank (37 Vorschriften)

${JSON.stringify(compactRegs, null, 2)}`;

    // Fetch with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    let response: Response;
    try {
      response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
        }),
        signal: controller.signal,
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return NextResponse.json(
          { error: "OpenAI request timed out. Please try again." },
          { status: 504 }
        );
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("OpenAI API error:", response.status, errorBody);
      return NextResponse.json(
        { error: `OpenAI API error: ${response.status}` },
        { status: 502 }
      );
    }

    const completion = await response.json();
    const content = completion.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "Empty response from OpenAI" },
        { status: 502 }
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error("Failed to parse OpenAI response:", content.slice(0, 200));
      return NextResponse.json(
        { error: "Invalid response format from AI" },
        { status: 502 }
      );
    }

    const regulations = validateResponse(parsed, regulationMap);

    return NextResponse.json({ regulations });
  } catch (error) {
    console.error("Scan API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
