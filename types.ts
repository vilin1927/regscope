export type Screen =
  | "auth"
  | "dashboard"
  | "company-search"
  | "questionnaire"
  | "processing"
  | "results"
  | "scan-history"
  | "risk-analysis"
  | "newsletter"
  | "recommendations"
  | "admin-newsletter"
  | "admin-users"
  | "admin-templates"
  | "admin-consultants"
  | "consultant-register"
  | "consultant-signup"
  | "consultant-dashboard"
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
