export type RegulationCategory =
  | "arbeitssicherheit"
  | "arbeitsrecht"
  | "gewerberecht"
  | "umweltrecht"
  | "produktsicherheit"
  | "datenschutz"
  | "versicherungspflichten";

export type Jurisdiction = "eu" | "bund" | "land" | "branche";
export type RiskLevel = "hoch" | "mittel" | "niedrig";
export type ComplianceStatus = "erfuellt" | "pruefung" | "fehlend";

export interface AppliesCondition {
  field: string;
  operator: "eq" | "in" | "gt" | "exists" | "true";
  value?: unknown;
}

export interface Regulation {
  id: string;
  name: string;
  officialReference: string;
  jurisdiction: Jurisdiction;
  category: RegulationCategory;
  summary: string;
  keyRequirements: string[];
  potentialPenalty: string;
  riskLevel: RiskLevel;
  sourceUrl: string;
  appliesWhen: AppliesCondition[];
  niche: string;
  whyAppliesTemplate: string;
}

export interface MatchedRegulation extends Regulation {
  status: ComplianceStatus;
  whyApplies: string;
}
