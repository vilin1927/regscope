"use client";

import { motion } from "framer-motion";
import { Download, RotateCcw, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { StatsBar } from "./StatsBar";
import { BusinessProfileSummary } from "./BusinessProfileSummary";
import { RegulationList } from "./RegulationList";
import type { MatchedRegulation } from "@/data/regulations/matching-engine";
import type { BusinessProfile } from "@/data/questionnaire/types";

interface ResultsScreenProps {
  profile: BusinessProfile;
  regulations: MatchedRegulation[];
  complianceChecks: Record<string, boolean>;
  onComplianceChange: (regulationId: string, checked: boolean) => void;
  onReset: () => void;
}

export function ResultsScreen({
  profile,
  regulations,
  complianceChecks,
  onComplianceChange,
  onReset,
}: ResultsScreenProps) {
  const t = useTranslations("Results");

  const highPriority = regulations.filter(
    (r) => r.riskLevel === "hoch"
  ).length;

  const categories = new Set(regulations.map((r) => r.category));

  const checkedCount = Object.values(complianceChecks).filter(Boolean).length;
  const complianceScore =
    regulations.length > 0
      ? Math.round((checkedCount / regulations.length) * 100)
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {t("title")}
          </h1>
          <p className="text-gray-500">
            {t("regulationsFound", { count: regulations.length })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" /> {t("exportReport")}
          </button>
          <button
            onClick={onReset}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> {t("newScan")}
          </button>
        </div>
      </div>

      <StatsBar
        totalRegulations={regulations.length}
        highPriority={highPriority}
        categoriesCovered={categories.size}
        complianceScore={complianceScore}
      />

      <BusinessProfileSummary profile={profile} />

      {/* Disclaimer */}
      <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 font-medium">
          {t("disclaimer")}
        </p>
      </div>

      {/* Regulations by category */}
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        {t("relevantRegulations")}
      </h2>
      <RegulationList
        regulations={regulations}
        complianceChecks={complianceChecks}
        onComplianceChange={onComplianceChange}
      />
    </motion.div>
  );
}
