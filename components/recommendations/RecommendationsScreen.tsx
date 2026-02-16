"use client";

import { motion } from "framer-motion";
import {
  Lightbulb,
  AlertTriangle,
  Loader2,
  Shield,
  Check,
  Clock,
  Info,
  BarChart3,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRecommendations } from "@/hooks/useRecommendations";
import type { RecommendationTimeline } from "@/types/addons";

interface RecommendationsScreenProps {
  scanId?: string;
  hasResults: boolean;
  hasRiskReport?: boolean;
}

const timelineColors: Record<RecommendationTimeline, string> = {
  sofort: "bg-red-100 text-red-700",
  kurzfristig: "bg-amber-100 text-amber-700",
  geplant: "bg-blue-100 text-blue-700",
};

export function RecommendationsScreen({
  scanId,
  hasResults,
  hasRiskReport,
}: RecommendationsScreenProps) {
  const t = useTranslations("Recommendations");
  const { report, isLoading, isGenerating, error, generate } =
    useRecommendations(scanId);

  // State 1: No scan results
  if (!hasResults || !scanId) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="max-w-3xl mx-auto"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
            <Lightbulb className="w-6 h-6 text-amber-600" />
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

  // State 2: Loading
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="max-w-3xl mx-auto"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
            <Lightbulb className="w-6 h-6 text-amber-600" />
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="max-w-3xl mx-auto"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
            <Lightbulb className="w-6 h-6 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <Loader2 className="w-8 h-8 text-amber-500 mx-auto mb-3 animate-spin" />
          <p className="text-gray-900 font-medium mb-1">{t("generating")}</p>
          <p className="text-gray-500 text-sm">{t("generatingDesc")}</p>
        </div>
      </motion.div>
    );
  }

  // State 4: No report — generate button
  if (!report) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="max-w-3xl mx-auto"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
            <Lightbulb className="w-6 h-6 text-amber-600" />
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

        {hasRiskReport === false && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700">{t("riskTip")}</p>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-700 font-medium mb-2">{t("readyToGenerate")}</p>
          <p className="text-gray-500 text-sm mb-6">{t("readyToGenerateDesc")}</p>
          <button
            onClick={generate}
            className="px-6 py-2.5 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
          >
            {t("generateRecommendations")}
          </button>
        </div>
      </motion.div>
    );
  }

  // State 5: Report ready — grouped by timeline
  const grouped = {
    sofort: report.items.filter((i) => i.timeline === "sofort"),
    kurzfristig: report.items.filter((i) => i.timeline === "kurzfristig"),
    geplant: report.items.filter((i) => i.timeline === "geplant"),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl mx-auto"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
          <Lightbulb className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {t("foundActions", { count: report.items.length })}
          </p>
        </div>
      </div>

      {/* Summary */}
      {report.summary && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <p className="text-sm text-amber-800">{report.summary}</p>
        </div>
      )}

      {/* Timeline groups */}
      {(["sofort", "kurzfristig", "geplant"] as const).map(
        (timeline) =>
          grouped[timeline].length > 0 && (
            <div key={timeline} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${timelineColors[timeline]}`}
                >
                  {t(`timeline.${timeline}`)}
                </span>
                <span className="text-xs text-gray-400">
                  {grouped[timeline].length}{" "}
                  {grouped[timeline].length === 1
                    ? t("action")
                    : t("actions")}
                </span>
              </div>
              <div className="space-y-3">
                {grouped[timeline].map((item, i) => (
                  <div
                    key={`${timeline}-${i}`}
                    className="bg-white border border-gray-200 rounded-xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          item.type === "insurance"
                            ? "bg-amber-100"
                            : "bg-blue-100"
                        }`}
                      >
                        {item.type === "insurance" ? (
                          <Shield className="w-3.5 h-3.5 text-amber-600" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-900">
                            {item.title}
                          </p>
                          {item.type === "insurance" && (
                            <span className="text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                              {t("insurance")}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {t(`timeline.${item.timeline}`)}
                            </span>
                          </div>
                          {item.regulationName && (
                            <span className="text-xs text-gray-400">
                              {item.regulationName}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0">
                        <span className="text-xs font-bold text-gray-400">
                          P{item.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
      )}
    </motion.div>
  );
}
