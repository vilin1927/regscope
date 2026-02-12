"use client";

import { FileText, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";

interface ScanHistoryCardProps {
  id: string;
  companyName: string;
  date: string;
  regulationCount: number;
  complianceScore: number;
  onView: () => void;
  onRerun: () => void;
}

export function ScanHistoryCard({
  companyName,
  date,
  regulationCount,
  complianceScore,
  onView,
  onRerun,
}: ScanHistoryCardProps) {
  const t = useTranslations("ScanHistory");

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{companyName}</h3>
          <p className="text-sm text-gray-500">{date}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">
              {regulationCount} {t("regulations")}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">
              {complianceScore}% {t("score")}
            </span>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onView}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {t("view")}
        </button>
        <button
          onClick={onRerun}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          {t("rerun")}
        </button>
      </div>
    </div>
  );
}
