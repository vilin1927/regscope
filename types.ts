export type Screen =
  | "auth"
  | "dashboard"
  | "questionnaire"
  | "processing"
  | "results"
  | "scan-history"
  | "risk-analysis"
  | "newsletter"
  | "recommendations"
  | "settings"
  | "impressum"
  | "datenschutz";

export interface ScanRecord {
  id: string;
  companyName: string;
  date: string;
  regulationCount: number;
  complianceScore: number;
  businessProfile: Record<string, unknown>;
  matchedRegulationIds: string[];
}
