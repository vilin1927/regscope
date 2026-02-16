// ============================================================
// Addon types for Risk Analysis, Recommendations, Newsletter
// ============================================================

import type { RegulationCategory } from "@/data/regulations/types";

// --- Risk Analysis ---

export type RiskSeverity = "kritisch" | "hoch" | "mittel" | "niedrig";

export interface RiskItem {
  regulationId: string;
  regulationName: string;
  severity: RiskSeverity;
  complianceGap: string;
  deadline: string;
  potentialPenalty: string;
  mitigation: string;
}

export interface RiskReport {
  id: string;
  scanId: string;
  items: RiskItem[];
  summary: string;
  createdAt: string;
}

// --- Recommendations ---

export type RecommendationTimeline = "sofort" | "kurzfristig" | "geplant";
export type RecommendationType = "action" | "insurance";

export interface RecommendationItem {
  priority: number;
  title: string;
  description: string;
  timeline: RecommendationTimeline;
  type: RecommendationType;
  regulationId?: string;
  regulationName?: string;
}

export interface RecommendationReport {
  id: string;
  scanId: string;
  items: RecommendationItem[];
  summary: string;
  createdAt: string;
}

// --- Newsletter ---

export type NewsletterFrequency = "weekly" | "monthly";

export interface NewsletterPreferences {
  optedIn: boolean;
  frequency: NewsletterFrequency;
  areas: RegulationCategory[];
}
