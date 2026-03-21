/**
 * AI-powered dynamic questionnaire generator.
 * Generates industry-specific compliance questions from Gegenstand + industry code.
 * Output matches QuestionnaireLayer[] format for seamless rendering.
 */

import { callOpenAI } from "@/lib/api-helpers";
import type { QuestionnaireLayer } from "./types";

const GENERATION_PROMPT = `Du bist ein Compliance-Experte für deutsche Unternehmen.

Erstelle einen branchenspezifischen Fragebogen für ein Compliance-Audit.
Der Fragebogen muss EXAKT das folgende JSON-Format haben:

{
  "layers": [
    {
      "id": 1,
      "title": "Unternehmensdaten",
      "subtitle": "Grundlegende Angaben zu Ihrem Betrieb",
      "icon": "Building2",
      "optional": false,
      "fields": [
        {
          "id": "companyName",
          "type": "text",
          "label": "Firmenname",
          "placeholder": "z.B. Firmenname GmbH",
          "required": true,
          "isComplianceCheck": false
        },
        {
          "id": "legalForm",
          "type": "select",
          "label": "Rechtsform",
          "required": true,
          "isComplianceCheck": false,
          "options": [
            { "value": "einzelunternehmen", "label": "Einzelunternehmen" },
            { "value": "gmbh", "label": "GmbH" },
            { "value": "ug", "label": "UG (haftungsbeschränkt)" },
            { "value": "gbr", "label": "GbR" },
            { "value": "kg", "label": "KG" },
            { "value": "ohg", "label": "OHG" },
            { "value": "sonstige", "label": "Sonstige" }
          ]
        }
      ]
    }
  ]
}

REGELN:
1. Erstelle 5-7 Layer (Abschnitte) mit je 3-8 Feldern
2. Layer 1 MUSS immer "Unternehmensdaten" sein mit companyName, legalForm, bundesland, businessLocation
3. Layer 2 MUSS immer "Mitarbeiter & Organisation" sein mit employeeCount, employeeTypes
4. Layer 3-7: branchenspezifische Fragen zu Compliance, Sicherheit, Lizenzen, Umwelt, Versicherungen
5. Feldtypen: "text", "date", "select", "multiselect", "toggle"
6. "toggle" = Ja/Nein-Frage, ideal für Compliance-Checks (isComplianceCheck: true)
7. "select" und "multiselect" MÜSSEN ein "options" Array haben
8. Jede Frage muss auf Deutsch sein
9. Verwende camelCase für field IDs (z.B. "hasHaccpCertificate", "fireExtinguishersPresent")
10. Setze isComplianceCheck: true bei Fragen die eine Pflicht prüfen (z.B. "Gefährdungsbeurteilung durchgeführt?")
11. icon Werte: "Building2", "Users", "Shield", "Package", "Truck", "Leaf", "FileCheck"
12. Bundesland-Feld muss alle 16 Bundesländer als Optionen haben
13. employeeCount Optionen: "0" (Soloselbständig), "1-5", "6-10", "11-20", "20+"

WICHTIG: Die Fragen müssen BRANCHENSPEZIFISCH sein!
- Eine Bäckerei braucht HACCP, Hygieneschulungen, Lebensmittelkennzeichnung
- Ein IT-Unternehmen braucht Datenschutz, DSGVO, Lizenzen
- Ein Bauunternehmen braucht Baustellensicherheit, Gerüstprüfungen, Arbeitszeiterfassung
- Nicht einfach generische Fragen stellen!`;

export interface GeneratedQuestionnaire {
  layers: QuestionnaireLayer[];
  industry_code: string;
}

export async function generateQuestionnaire(
  gegenstand: string,
  industryCode: string,
  industryLabel: string
): Promise<QuestionnaireLayer[]> {
  const userPrompt = `Erstelle einen Compliance-Fragebogen für folgendes Unternehmen:

Branche: ${industryLabel} (Code: ${industryCode})
Unternehmensgegenstand: ${gegenstand}

Generiere die branchenspezifischen Fragen als JSON.`;

  const { content, error } = await callOpenAI(
    GENERATION_PROMPT,
    userPrompt,
    undefined,
    5000
  );

  if (error || !content) {
    throw new Error(error || "Keine Antwort vom KI-System");
  }

  const parsed = JSON.parse(content) as { layers: QuestionnaireLayer[] };

  if (!parsed.layers || !Array.isArray(parsed.layers) || parsed.layers.length === 0) {
    throw new Error("KI hat keinen gültigen Fragebogen generiert");
  }

  // Validate and fix each layer
  return parsed.layers.map((layer, i) => ({
    id: layer.id || i + 1,
    title: layer.title || `Abschnitt ${i + 1}`,
    subtitle: layer.subtitle || "",
    icon: layer.icon || "FileCheck",
    optional: layer.optional ?? (i >= 5),
    fields: (layer.fields || []).map((field) => ({
      id: field.id,
      type: field.type || "text",
      label: field.label,
      placeholder: field.placeholder,
      options: field.options,
      required: field.required ?? true,
      isComplianceCheck: field.isComplianceCheck ?? false,
    })),
    conditionalFields: layer.conditionalFields,
  }));
}
