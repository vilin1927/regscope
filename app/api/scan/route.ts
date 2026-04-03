import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { carpentryRegulations } from "@/data/regulations/carpentry-regulations";
import { callOpenAI } from "@/lib/api-helpers";
import type {
  Regulation,
  MatchedRegulation,
  ComplianceStatus,
  Jurisdiction,
  RegulationCategory,
  RiskLevel,
} from "@/data/regulations/types";

export const maxDuration = 60;

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

interface CompanyContext {
  name: string;
  gegenstand: string | null;
  industryCode?: string;
  industryLabel?: string;
}

// --- Static mode: carpentry with reference regulation database ---

function validateStaticResponse(
  parsed: unknown,
  regulationMap: Map<string, Regulation>
): MatchedRegulation[] {
  const data = parsed as { regulations?: unknown[] };
  if (!data.regulations || !Array.isArray(data.regulations)) {
    throw new Error("Antwort enthält kein 'regulations'-Array");
  }

  const results: MatchedRegulation[] = [];

  for (const item of data.regulations) {
    const r = item as Record<string, unknown>;
    const id = r.id as string;

    const sourceReg = regulationMap.get(id);
    if (!sourceReg) continue; // Skip unknown regulation IDs

    const status = r.status as ComplianceStatus;
    if (!VALID_STATUSES.includes(status)) continue;

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

async function runStaticScan(profile: Record<string, unknown>): Promise<MatchedRegulation[]> {
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

  const { content, error } = await callOpenAI(systemPrompt, userPrompt);

  if (error || !content) {
    throw new Error(error || "Keine Antwort vom KI-System");
  }

  const parsed = JSON.parse(content);
  return validateStaticResponse(parsed, regulationMap);
}

// --- Dynamic mode: AI identifies regulations for any industry ---

function validateDynamicResponse(parsed: unknown): MatchedRegulation[] {
  const data = parsed as { regulations?: unknown[] };
  if (!data.regulations || !Array.isArray(data.regulations)) {
    throw new Error("Antwort enthält kein 'regulations'-Array");
  }

  const results: MatchedRegulation[] = [];

  for (const item of data.regulations) {
    const r = item as Record<string, unknown>;

    const status = r.status as ComplianceStatus;
    if (!VALID_STATUSES.includes(status)) continue;

    const jurisdiction = VALID_JURISDICTIONS.includes(r.jurisdiction as Jurisdiction)
      ? (r.jurisdiction as Jurisdiction)
      : "bund";
    const category = VALID_CATEGORIES.includes(r.category as RegulationCategory)
      ? (r.category as RegulationCategory)
      : "gewerberecht";
    const riskLevel = VALID_RISK_LEVELS.includes(r.riskLevel as RiskLevel)
      ? (r.riskLevel as RiskLevel)
      : "mittel";

    // Generate a stable ID from the regulation name
    const id = typeof r.id === "string" && r.id.length > 0
      ? r.id
      : (r.name as string || "unknown").toLowerCase().replace(/[^a-z0-9äöüß]/g, "-").replace(/-+/g, "-").substring(0, 50);

    results.push({
      id,
      name: typeof r.name === "string" ? r.name : "Unbekannte Vorschrift",
      officialReference: typeof r.officialReference === "string" ? r.officialReference : "",
      jurisdiction,
      category,
      summary: typeof r.summary === "string" ? r.summary : "",
      keyRequirements: Array.isArray(r.keyRequirements) ? r.keyRequirements as string[] : [],
      potentialPenalty: typeof r.potentialPenalty === "string" ? r.potentialPenalty : "",
      riskLevel,
      sourceUrl: typeof r.sourceUrl === "string" ? r.sourceUrl : "",
      appliesWhen: [],
      niche: "dynamic",
      whyAppliesTemplate: "",
      status,
      whyApplies: typeof r.whyApplies === "string" ? r.whyApplies : "",
    });
  }

  return results;
}

async function runDynamicScan(
  profile: Record<string, unknown>,
  companyContext: CompanyContext
): Promise<MatchedRegulation[]> {
  const industryInfo = companyContext.industryLabel
    ? `${companyContext.industryLabel} (${companyContext.industryCode})`
    : companyContext.gegenstand || "Unbekannte Branche";

  const systemPrompt = `Du bist ein erfahrener deutscher Rechtsberater, spezialisiert auf regulatorische Compliance für deutsche Unternehmen aller Branchen.

Du erhältst:
1. Informationen zum Unternehmen (Name, Branche, Handelsregister-Gegenstand)
2. Ein Unternehmensprofil (Betriebsdaten aus einem branchenspezifischen Fragebogen)

Deine Aufgabe:
- Identifiziere alle deutschen und EU-Vorschriften, die für dieses konkrete Unternehmen gelten
- Berücksichtige die Branche, Mitarbeiterzahl, Bundesland, und alle spezifischen Angaben aus dem Profil
- Setze für jede Vorschrift einen Compliance-Status basierend auf den Antworten im Profil:
  - "erfuellt": Der Betrieb hat die entsprechenden Maßnahmen getroffen
  - "fehlend": Der Betrieb hat die Maßnahmen NICHT getroffen
  - "pruefung": Nicht genügend Information oder Status unklar

Antworte ausschließlich im folgenden JSON-Format:
{
  "regulations": [
    {
      "id": "<kurzer-kebab-case-identifier>",
      "name": "<Offizieller Name der Vorschrift>",
      "officialReference": "<Gesetzesreferenz, z.B. 'ArbSchG §§ 3–14'>",
      "jurisdiction": "<eu|bund|land|branche>",
      "category": "<arbeitssicherheit|arbeitsrecht|gewerberecht|umweltrecht|produktsicherheit|datenschutz|versicherungspflichten>",
      "summary": "<2-3 Sätze Zusammenfassung der Vorschrift>",
      "keyRequirements": ["<Anforderung 1>", "<Anforderung 2>", "..."],
      "potentialPenalty": "<Mögliche Strafe/Bußgeld>",
      "riskLevel": "<hoch|mittel|niedrig>",
      "sourceUrl": "<URL zur offiziellen Quelle>",
      "status": "<erfuellt|pruefung|fehlend>",
      "whyApplies": "<2-3 Sätze, WARUM diese Vorschrift für diesen konkreten Betrieb gilt>"
    }
  ]
}

Wichtig:
- Identifiziere die 10-20 wichtigsten Vorschriften für die Branche "${industryInfo}"
- Berücksichtige: Arbeitsrecht, Gewerberecht, Umweltrecht, Datenschutz, branchenspezifische Vorschriften
- Sortiere nach Risikolevel: hoch zuerst, dann mittel, dann niedrig
- Die whyApplies-Texte sollen konkret und hilfreich sein — beziehe dich auf die konkreten Betriebsdaten
- Verwende echte, existierende deutsche Gesetze und Vorschriften mit korrekten Referenzen
- sourceUrl soll auf gesetze-im-internet.de oder andere offizielle Quellen verweisen`;

  const userPrompt = `## Unternehmen

Firmenname: ${companyContext.name}
Branche: ${industryInfo}
Handelsregister-Gegenstand: ${companyContext.gegenstand || "Nicht verfügbar"}

## Unternehmensprofil (Antworten aus dem Fragebogen)

${JSON.stringify(profile, null, 2)}`;

  const { content, error } = await callOpenAI(systemPrompt, userPrompt, undefined, 8000);

  if (error || !content) {
    throw new Error(error || "Keine Antwort vom KI-System");
  }

  const parsed = JSON.parse(content);
  return validateDynamicResponse(parsed);
}

// --- Main handler ---

export async function POST(request: Request) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut." },
        { status: 429 }
      );
    }

    // Auth check — allow both authenticated users and guests
    const session = await auth();
    const userId = session?.user?.id ?? "guest";
    console.info(`Scan request from user: ${userId}`);

    let body: { profile?: unknown; companyContext?: CompanyContext };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Ungültiges JSON im Anfragekörper" },
        { status: 400 }
      );
    }

    const { profile, companyContext } = body;

    if (!profile || typeof profile !== "object") {
      return NextResponse.json(
        { error: "Unternehmensprofil fehlt" },
        { status: 400 }
      );
    }

    const profileObj = profile as Record<string, unknown>;

    // Determine scan mode: dynamic (AI-powered for any industry) or static (carpentry fallback)
    // Use dynamic if we have company context OR user entered a free-text industry
    const userIndustry = profileObj.industry as string | undefined;
    const isDynamic = companyContext?.gegenstand || companyContext?.industryCode || userIndustry;

    let regulations: MatchedRegulation[];

    if (isDynamic) {
      // Build or use company context for dynamic scan
      const effectiveContext: CompanyContext = companyContext || {
        name: (profileObj.companyName as string) || "Unbekannt",
        gegenstand: null,
        industryLabel: userIndustry,
      };
      // If no industryLabel from Handelsregister, use the free-text industry
      if (!effectiveContext.industryLabel && userIndustry) {
        effectiveContext.industryLabel = userIndustry;
      }
      console.info(`Dynamic scan for industry: ${effectiveContext.industryCode || effectiveContext.industryLabel || "unknown"} (${effectiveContext.name})`);
      regulations = await runDynamicScan(profileObj, effectiveContext);
    } else {
      // Static carpentry mode — validate required fields
      const missingFields = ["industry", "employeeCount"].filter((f) => !profileObj[f]);
      if (missingFields.length > 0) {
        return NextResponse.json(
          { error: `Fehlende Pflichtfelder: ${missingFields.join(", ")}` },
          { status: 400 }
        );
      }
      regulations = await runStaticScan(profileObj);
    }

    return NextResponse.json({ regulations });
  } catch (error) {
    console.error("Scan API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
