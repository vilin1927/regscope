import { NextResponse } from "next/server";
import { carpentryRegulations } from "@/data/regulations/carpentry-regulations";
import type {
  Regulation,
  MatchedRegulation,
  ComplianceStatus,
  Jurisdiction,
  RegulationCategory,
  RiskLevel,
} from "@/data/regulations/types";

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
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || "gpt-4o";

    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const { profile } = await request.json();

    if (!profile || typeof profile !== "object") {
      return NextResponse.json(
        { error: "Missing business profile" },
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

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
    });

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

    const parsed = JSON.parse(content);
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
