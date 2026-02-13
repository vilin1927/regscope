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

import type { MatchedRegulation } from "@/data/regulations/types";

export interface ScanRecord {
  id: string;
  companyName: string;
  date: string;
  regulationCount: number;
  complianceScore: number;
  businessProfile: Record<string, unknown>;
  matchedRegulationIds: string[];
  matchedRegulations?: MatchedRegulation[];
}
