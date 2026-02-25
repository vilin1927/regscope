"use client";

import { Lightbulb, CheckCircle2, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

interface HowToImproveProps {
  score: number;
  lowestCategory?: { name: string; checked: number; total: number };
  onViewResults: () => void;
}

export function HowToImprove({ score, lowestCategory, onViewResults }: HowToImproveProps) {
  const t = useTranslations("Dashboard");
  const tCat = useTranslations("Results.category");

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 mb-6">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
          <Lightbulb className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{t("howToImproveTitle")}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{t("howToImproveSubtitle")}</p>
        </div>
      </div>
      <div className="space-y-2 ml-11">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700">{t("howToStep1")}</p>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700">{t("howToStep2")}</p>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700">{t("howToStep3")}</p>
        </div>
      </div>
      {lowestCategory && lowestCategory.checked < lowestCategory.total && (
        <div className="mt-3 ml-11 p-3 bg-amber-50 rounded-lg">
          <p className="text-xs text-amber-800">
            {t("focusCategory", { category: tCat(lowestCategory.name), checked: lowestCategory.checked, total: lowestCategory.total })}
          </p>
        </div>
      )}
      <button
        onClick={onViewResults}
        className="mt-3 ml-11 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        {t("viewFullResults")} <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
