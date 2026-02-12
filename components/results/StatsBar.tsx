"use client";

import { FileText, AlertTriangle, Layers, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";

interface StatsBarProps {
  totalRegulations: number;
  highPriority: number;
  categoriesCovered: number;
  complianceScore: number;
}

export function StatsBar({
  totalRegulations,
  highPriority,
  categoriesCovered,
  complianceScore,
}: StatsBarProps) {
  const t = useTranslations("Results");

  const stats = [
    {
      value: String(totalRegulations),
      label: t("totalRegulations"),
      icon: FileText,
      color: "text-blue-600 bg-blue-100",
    },
    {
      value: String(highPriority),
      label: t("highPriority"),
      icon: AlertTriangle,
      color: "text-red-600 bg-red-100",
    },
    {
      value: String(categoriesCovered),
      label: t("categoriesCovered"),
      icon: Layers,
      color: "text-green-600 bg-green-100",
    },
    {
      value: `${complianceScore}%`,
      label: t("complianceScore"),
      icon: TrendingUp,
      color: "text-purple-600 bg-purple-100",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3"
        >
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${s.color}`}
          >
            <s.icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
