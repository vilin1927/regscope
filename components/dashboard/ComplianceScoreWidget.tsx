"use client";

import { useTranslations } from "next-intl";

interface ComplianceScoreWidgetProps {
  score: number;
  regulationCount: number;
}

export function ComplianceScoreWidget({
  score,
  regulationCount,
}: ComplianceScoreWidgetProps) {
  const t = useTranslations("Dashboard");

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score <= 33
      ? { stroke: "#ef4444", bg: "bg-red-50", text: "text-red-600" }
      : score <= 66
        ? { stroke: "#f59e0b", bg: "bg-amber-50", text: "text-amber-600" }
        : { stroke: "#22c55e", bg: "bg-green-50", text: "text-green-600" };

  return (
    <div className={`${color.bg} rounded-2xl p-6 mb-8 flex flex-col items-center`}>
      <div className="relative w-36 h-36 mb-3">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="10"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={color.stroke}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-3xl font-bold ${color.text}`}>
            {score}
          </span>
        </div>
      </div>
      <p className="text-sm font-semibold text-gray-900">
        {t("complianceScore")}
      </p>
      <p className="text-xs text-gray-500">
        {t("basedOnRegulations", { count: regulationCount })}
      </p>
    </div>
  );
}
