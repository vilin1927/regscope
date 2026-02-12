import type { Regulation, ComplianceStatus } from "./types";
import type { BusinessProfile } from "../questionnaire/types";

export interface MatchedRegulation extends Regulation {
  status: ComplianceStatus;
  whyApplies: string;
}

function evaluateCondition(
  condition: { field: string; operator: string; value?: unknown },
  profile: BusinessProfile
): boolean {
  const fieldValue = profile[condition.field];

  switch (condition.operator) {
    case "eq":
      return fieldValue === condition.value;
    case "in": {
      if (Array.isArray(fieldValue)) {
        // If field value is an array (multiselect), check if any value in condition.value is in fieldValue
        const condValues = condition.value as unknown[];
        return condValues.some((v) => (fieldValue as unknown[]).includes(v));
      }
      // If field value is a single value, check if it's in the condition array
      const arr = condition.value as unknown[];
      return arr.includes(fieldValue);
    }
    case "gt": {
      // For employee count ranges like "0", "1-5", "6-10", "11-20", "20+"
      // Convert to numeric lower bound for comparison
      const numericOrder: Record<string, number> = {
        "0": 0,
        "1-5": 1,
        "6-10": 6,
        "11-20": 11,
        "20+": 21,
      };
      const fieldNum = numericOrder[fieldValue as string] ?? (Number(fieldValue) || 0);
      const conditionNum = numericOrder[condition.value as string] ?? (Number(condition.value) || 0);
      return fieldNum > conditionNum;
    }
    case "exists":
      return fieldValue !== undefined && fieldValue !== null && fieldValue !== "";
    case "true":
      return fieldValue === true;
    case "includes": {
      // fieldValue is an array (multiselect), check if it includes condition.value
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(condition.value);
      }
      return false;
    }
    default:
      return false;
  }
}

// Map of regulation fields to compliance-check questionnaire fields
const complianceCheckMap: Record<string, string[]> = {
  "arbschg": ["riskAssessment", "safetyInstructions", "ppeProvided", "firstAidPersonnel"],
  "arbstaettv": ["emergencyExits", "fireExtinguishers", "escapeRoutePlan"],
  "betrsichv": ["riskAssessment"],
  "dguv-vorschrift-1": ["safetyInstructions", "firstAidPersonnel"],
  "dguv-regel-109-606": ["dustExtraction", "ppeProvided"],
  "trgs-553": ["dustExtraction"],
  "gefstoffv": ["dustExtraction"],
  "psa-bv": ["ppeProvided"],
  "milog": ["writtenContracts"],
  "arbzg": ["writtenContracts"],
  "muschg": ["writtenContracts"],
  "jarbschg": ["writtenContracts"],
  "bbig": ["writtenContracts"],
  "nachwg": ["writtenContracts"],
  "hwo": ["handwerksrolle"],
  "gewo": ["handelsregister"],
  "meisterpflicht": ["handwerksrolle"],
  "handwerksrolle": ["handwerksrolle"],
  "schwarzarbg": ["handwerksrolle", "writtenContracts"],
  "bimschg": ["environmentalPermits"],
  "krwg": ["certifiedDisposal"],
  "verpackg": ["certifiedDisposal"],
  "chemverbotsv": ["certifiedDisposal"],
  "eutr": ["eoriNumber"],
  "prodsg": [],
  "prodhaftg": ["productLiabilityInsurance"],
  "ce-kennzeichnung": [],
  "din-normen-moebel": [],
  "dsgvo": ["datenschutzerklaerung"],
  "bdsg": ["datenschutzerklaerung"],
  "ttdsg": ["datenschutzerklaerung"],
  "bg-bau": ["bgBauMembership"],
  "betriebshaftpflicht": ["publicLiability"],
  "berufshaftpflicht": ["productLiabilityInsurance"],
  "kfz-haftpflicht": [],
  "fernabsatzrecht": ["widerrufsbelehrung"],
  "eori-zollrecht": ["eoriNumber"],
};

function determineStatus(
  regulation: Regulation,
  profile: BusinessProfile
): ComplianceStatus {
  const checkFields = complianceCheckMap[regulation.id];

  if (!checkFields || checkFields.length === 0) {
    return "pruefung";
  }

  const relevant = checkFields.filter(
    (f) => profile[f] !== undefined
  );

  if (relevant.length === 0) return "pruefung";

  const allTrue = relevant.every((f) => profile[f] === true);
  const anyFalse = relevant.some((f) => profile[f] === false);

  if (allTrue) return "erfuellt";
  if (anyFalse) return "fehlend";
  return "pruefung";
}

function generateWhyApplies(
  regulation: Regulation,
  profile: BusinessProfile
): string {
  // Replace all {placeholder} tokens with values from the business profile
  return regulation.whyAppliesTemplate.replace(
    /\{(\w+)\}/g,
    (_match: string, key: string) => {
      const value = profile[key];
      if (value === undefined || value === null) {
        return "\u2014";
      }
      if (Array.isArray(value)) {
        return value.join(", ");
      }
      return String(value);
    }
  );
}

export function matchRegulations(
  profile: BusinessProfile,
  regulations: Regulation[]
): MatchedRegulation[] {
  const matched: MatchedRegulation[] = [];

  for (const reg of regulations) {
    // A regulation applies if ALL its appliesWhen conditions are met
    const applies =
      reg.appliesWhen.length === 0 ||
      reg.appliesWhen.every((condition) =>
        evaluateCondition(condition, profile)
      );

    if (!applies) continue;

    matched.push({
      ...reg,
      status: determineStatus(reg, profile),
      whyApplies: generateWhyApplies(reg, profile),
    });
  }

  // Sort by risk level: hoch → mittel → niedrig
  const riskOrder = { hoch: 0, mittel: 1, niedrig: 2 };
  matched.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);

  return matched;
}

export function calculateComplianceScore(
  matched: MatchedRegulation[]
): number {
  if (matched.length === 0) return 0;
  const fulfilled = matched.filter((r) => r.status === "erfuellt").length;
  return Math.round((fulfilled / matched.length) * 100);
}
