/**
 * AI-powered industry detection from Handelsregister Gegenstand.
 * Maps free-text business purpose → standardized industry code + label.
 */

import { callOpenAI } from "./api-helpers";

export interface IndustryClassification {
  industry_code: string;
  industry_label_de: string;
  industry_label_en: string;
  confidence: number;
  sub_industries: string[];
}

const CLASSIFICATION_PROMPT = `Du bist ein Experte für die Klassifizierung deutscher Unternehmen nach Branche.

Analysiere den Unternehmensgegenstand (Gegenstand) aus dem Handelsregister und klassifiziere das Unternehmen.

Antworte IMMER im folgenden JSON-Format:
{
  "industry_code": "BRANCHENCODE",
  "industry_label_de": "Branchenbezeichnung auf Deutsch",
  "industry_label_en": "Industry label in English",
  "confidence": 0.95,
  "sub_industries": ["Teilbranche1", "Teilbranche2"]
}

Verwende diese standardisierten Branchencodes:
- HANDWERK_TISCHLEREI — Tischlerei, Schreinerei, Holzverarbeitung
- HANDWERK_BAECKEREI — Bäckerei, Konditorei
- HANDWERK_METZGEREI — Metzgerei, Fleischverarbeitung
- HANDWERK_ELEKTRO — Elektroinstallation, Elektrotechnik
- HANDWERK_SANITAER — Sanitär, Heizung, Klima (SHK)
- HANDWERK_MALER — Maler, Lackierer
- HANDWERK_KFZ — KFZ-Werkstatt, Karosseriebau
- HANDWERK_METALLBAU — Metallbau, Schlosserei
- HANDWERK_DACHDECKEREI — Dachdeckerei
- HANDWERK_FRISEUR — Friseursalon, Kosmetik
- HANDWERK_SONSTIG — Sonstiges Handwerk
- GASTRONOMIE — Restaurant, Gaststätte, Imbiss, Catering
- HOTELLERIE — Hotel, Pension, Beherbergung
- EINZELHANDEL — Einzelhandel, Ladengeschäft
- GROSSHANDEL — Großhandel, Distribution
- ECOMMERCE — Online-Handel, E-Commerce
- BAU_HOCH — Hochbau, Gebäudebau
- BAU_TIEF — Tiefbau, Straßenbau
- BAU_AUSBAU — Ausbaugewerbe, Innenausbau
- IT_DIENSTLEISTUNG — IT-Beratung, Softwareentwicklung
- IT_HANDEL — IT-Handel, Hardware
- BERATUNG — Unternehmensberatung, Consulting
- GESUNDHEIT — Arztpraxis, Therapie, Pflege
- APOTHEKE — Apotheke
- LANDWIRTSCHAFT — Landwirtschaft, Agrar
- LOGISTIK — Transport, Spedition, Logistik
- IMMOBILIEN — Immobilien, Hausverwaltung
- BILDUNG — Bildung, Schulung, Training
- KUNST_KULTUR — Kunst, Kultur, Medien
- PRODUKTION — Produktion, Fertigung, Herstellung
- ENERGIE — Energieversorgung, erneuerbare Energien
- SONSTIG — Falls keine der obigen Kategorien passt

Wichtig:
- Wähle den spezifischsten Code, der passt
- Bei Mischbetrieben: wähle die Haupttätigkeit, liste Nebentätigkeiten in sub_industries
- confidence: 0.0 bis 1.0 (wie sicher die Klassifizierung ist)`;

export async function classifyIndustry(
  gegenstand: string,
  companyName?: string
): Promise<IndustryClassification> {
  const userPrompt = companyName
    ? `Firma: ${companyName}\nGegenstand: ${gegenstand}`
    : `Gegenstand: ${gegenstand}`;

  const { content, error } = await callOpenAI(
    CLASSIFICATION_PROMPT,
    userPrompt,
    undefined,
    500
  );

  if (error || !content) {
    // Fallback: return generic classification
    return {
      industry_code: "SONSTIG",
      industry_label_de: "Sonstige Branche",
      industry_label_en: "Other Industry",
      confidence: 0,
      sub_industries: [],
    };
  }

  try {
    const parsed = JSON.parse(content) as IndustryClassification;
    return parsed;
  } catch {
    return {
      industry_code: "SONSTIG",
      industry_label_de: "Sonstige Branche",
      industry_label_en: "Other Industry",
      confidence: 0,
      sub_industries: [],
    };
  }
}
