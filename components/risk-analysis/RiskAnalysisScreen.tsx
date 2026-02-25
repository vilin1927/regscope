"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, AlertTriangle, Loader2, BarChart3, RefreshCw } from "lucide-react";
import { ScrollableRow } from "@/components/ui/ScrollableRow";
import { screenVariants, screenTransition } from "@/lib/motion";
import { useTranslations } from "next-intl";
import { useRiskAnalysis } from "@/hooks/useRiskAnalysis";
import { ExpertContactModal } from "@/components/ui/ExpertContactModal";
import { ExpertAvatar } from "@/components/ui/ExpertAvatar";
import { getExpertForCategory } from "@/data/experts";
import { useScanContext } from "@/components/providers/ScanProvider";
import { useSubscriptionContext } from "@/components/providers/SubscriptionProvider";
import type { RiskSeverity } from "@/types/addons";

const severityColors: Record<RiskSeverity, string> = {
  kritisch: "bg-red-100 text-red-800",
  hoch: "bg-red-100 text-red-700",
  mittel: "bg-amber-100 text-amber-700",
  niedrig: "bg-green-100 text-green-700",
};

const generalExpert = getExpertForCategory("general");

export function RiskAnalysisScreen() {
  const { currentScanId, hasResults } = useScanContext();
  const scanId = currentScanId ?? undefined;
  const { isPro, onUnlock } = useSubscriptionContext();
  const t = useTranslations("RiskAnalysis");
  const tExpert = useTranslations("Expert");
  const tExperts = useTranslations("Experts");
  const tPaywall = useTranslations("Paywall");
  const [expertModalOpen, setExpertModalOpen] = useState(false);
  const { report, isLoading, isGenerating, error, generate, regenerate } =
    useRiskAnalysis(scanId);

  // State 1: No scan results
  if (!hasResults || !scanId) {
    return (
      <motion.div
        variants={screenVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={screenTransition}
        className="max-w-3xl mx-auto"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">{t("noScanResults")}</p>
        </div>
      </motion.div>
    );
  }

  // State 2: Loading initial check
  if (isLoading) {
    return (
      <motion.div
        variants={screenVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={screenTransition}
        className="max-w-3xl mx-auto"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <Loader2 className="w-8 h-8 text-blue-500 mx-auto mb-3 animate-spin" />
          <p className="text-gray-500 text-sm">{t("loading")}</p>
        </div>
      </motion.div>
    );
  }

  // State 3: Generating
  if (isGenerating) {
    return (
      <motion.div
        variants={screenVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={screenTransition}
        className="max-w-3xl mx-auto"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <Loader2 className="w-8 h-8 text-red-500 mx-auto mb-3 animate-spin" />
          <p className="text-gray-900 font-medium mb-1">{t("generating")}</p>
          <p className="text-gray-500 text-sm">{t("generatingDesc")}</p>
        </div>
      </motion.div>
    );
  }

  // State 4: No report yet — show generate button
  if (!report) {
    return (
      <motion.div
        variants={screenVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={screenTransition}
        className="max-w-3xl mx-auto"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
            <p className="text-gray-500 text-sm mt-1">{t("description")}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <ShieldAlert className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-700 font-medium mb-2">{t("readyToAnalyze")}</p>
          <p className="text-gray-500 text-sm mb-6">{t("readyToAnalyzeDesc")}</p>
          <button
            onClick={() => generate()}
            className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            {t("runAnalysis")}
          </button>
        </div>
      </motion.div>
    );
  }

  // State 5: Report ready
  const severityCounts = report.items.reduce(
    (acc, item) => {
      acc[item.severity] = (acc[item.severity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <motion.div
      variants={screenVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={screenTransition}
      className="max-w-3xl mx-auto"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
          <ShieldAlert className="w-6 h-6 text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
              <p className="text-gray-500 text-sm mt-1">
                {t("foundIssues", { count: report.items.length })}
              </p>
            </div>
            <button
              onClick={regenerate}
              disabled={isGenerating}
              className="shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {t("rerun")}
            </button>
          </div>
        </div>
      </div>

      {/* Expert contact chip — under header */}
      <button
        onClick={() => setExpertModalOpen(true)}
        className="inline-flex items-center gap-2.5 pl-1.5 pr-3.5 py-1.5 mb-4 bg-white border border-gray-200 rounded-full text-sm hover:border-blue-300 hover:shadow-sm transition-all"
      >
        <ExpertAvatar expert={generalExpert} size="sm" />
        <div className="text-left">
          <p className="text-xs font-semibold text-gray-900 leading-tight">
            {tExperts(`${generalExpert.i18nKey}.name`)}
          </p>
          <p className="text-[11px] text-blue-600 leading-tight">
            {tExpert("consultExpert")}
          </p>
        </div>
      </button>

      {/* Summary */}
      {report.summary && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <p className="text-sm text-red-800">{report.summary}</p>
        </div>
      )}

      {/* Severity stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {(["kritisch", "hoch", "mittel", "niedrig"] as const).map((sev) => (
          <div
            key={sev}
            className="bg-white border border-gray-200 rounded-xl p-3 text-center"
          >
            <p className="text-2xl font-bold text-gray-900">
              {severityCounts[sev] || 0}
            </p>
            <span
              className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${severityColors[sev]}`}
            >
              {t(`severity.${sev}`)}
            </span>
          </div>
        ))}
      </div>

      {/* Risk table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <ScrollableRow fadeColor="white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">
                  {t("regulation")}
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">
                  {t("severityCol")}
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">
                  {t("gap")}
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">
                  {t("deadline")}
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">
                  {t("penalty")}
                </th>
              </tr>
            </thead>
            <tbody>
              {report.items.map((item, i) => {
                if (!isPro && i > 0) return null;
                return (
                  <tr
                    key={item.regulationId}
                    className="border-b border-gray-100 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {item.regulationName}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${severityColors[item.severity]}`}
                      >
                        {t(`severity.${item.severity}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.complianceGap}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{item.deadline}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.potentialPenalty}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ScrollableRow>
      </div>

      {/* Freemium blur for remaining rows */}
      {!isPro && report.items.length > 1 && (
        <div className="mt-4 relative rounded-xl border border-gray-200 bg-white p-6 text-center">
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-xl" />
          <div className="relative z-10">
            <p className="text-sm font-medium text-gray-700 mb-2">
              {tPaywall("moreRisks", { count: report.items.length - 1 })}
            </p>
            <button
              onClick={onUnlock}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 active:scale-95 transition-all"
            >
              {tPaywall("unlockAll")}
            </button>
          </div>
        </div>
      )}

      {/* Mitigation details */}
      <div className="mt-4 space-y-3">
        <h2 className="font-semibold text-gray-900">{t("mitigations")}</h2>
        {report.items
          .filter((item) => item.mitigation)
          .filter((_, i) => isPro || i === 0)
          .map((item) => (
            <div
              key={item.regulationId}
              className="bg-white border border-gray-200 rounded-xl p-4"
            >
              <p className="text-sm font-medium text-gray-900 mb-1">
                {item.regulationName}
              </p>
              <p className="text-sm text-gray-600">{item.mitigation}</p>
            </div>
          ))}
      </div>

      {expertModalOpen && (
        <ExpertContactModal
          categoryKey="general"
          onClose={() => setExpertModalOpen(false)}
        />
      )}
    </motion.div>
  );
}
