"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw, AlertTriangle, ArrowLeft } from "lucide-react";
import { screenVariants, screenTransition } from "@/lib/motion";
import { useTranslations } from "next-intl";
import { StatsBar } from "./StatsBar";
import { BusinessProfileSummary } from "./BusinessProfileSummary";
import { RegulationList } from "./RegulationList";
import { ExpertContactModal } from "@/components/ui/ExpertContactModal";
import { useScanContext } from "@/components/providers/ScanProvider";
import { useSubscriptionContext } from "@/components/providers/SubscriptionProvider";
import type { RegulationCategory } from "@/data/regulations/types";

interface ResultsScreenProps {
  onReset: () => void;
  onBack?: () => void;
}

export function ResultsScreen({ onReset, onBack }: ResultsScreenProps) {
  const t = useTranslations("Results");
  const [expertModalCategory, setExpertModalCategory] = useState<RegulationCategory | null>(null);
  const {
    businessProfile: profile,
    matchedRegulations: regulations,
    complianceChecks,
    handleComplianceChange: onComplianceChange,
  } = useScanContext();
  const { isPro, onUnlock } = useSubscriptionContext();

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
      variants={screenVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={screenTransition}
      className="max-w-4xl mx-auto"
    >
      {/* Back link */}
      {onBack && (
        <button
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1 mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("backToHistory")}
        </button>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
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
        onExpertContact={setExpertModalCategory}
        isPro={isPro}
        onUnlock={onUnlock}
      />

      {expertModalCategory && (
        <ExpertContactModal
          categoryKey={expertModalCategory}
          onClose={() => setExpertModalCategory(null)}
        />
      )}
    </motion.div>
  );
}
