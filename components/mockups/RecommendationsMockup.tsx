"use client";

import { Shield, Check, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import type { MatchedRegulation } from "@/data/regulations/matching-engine";

interface RecommendationsMockupProps {
  regulations?: MatchedRegulation[];
}

export function RecommendationsMockup({
  regulations,
}: RecommendationsMockupProps) {
  const t = useTranslations("Mockups.recommendations");

  const items = regulations
    ? regulations
        .filter((r) => r.status !== "erfuellt")
        .slice(0, 5)
        .map((r) => ({
          action: r.keyRequirements[0] || r.name,
          timeline:
            r.riskLevel === "hoch"
              ? t("immediate")
              : r.riskLevel === "mittel"
                ? t("soon")
                : t("planned"),
          type: r.category === "versicherungspflichten" ? "insurance" : "action",
        }))
    : [
        {
          action: "Gefährdungsbeurteilung durchführen (ArbSchG §5)",
          timeline: t("immediate"),
          type: "action",
        },
        {
          action: "Sicherheitsunterweisung dokumentieren (DGUV Vorschrift 1)",
          timeline: t("immediate"),
          type: "action",
        },
        {
          action: "Betriebshaftpflichtversicherung prüfen",
          timeline: t("soon"),
          type: "insurance",
        },
        {
          action: "Gefahrstoffverzeichnis erstellen (GefStoffV)",
          timeline: t("soon"),
          type: "action",
        },
        {
          action: "BG BAU-Mitgliedschaft bestätigen",
          timeline: t("planned"),
          type: "insurance",
        },
      ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                item.type === "insurance" ? "bg-amber-100" : "bg-blue-100"
              }`}
            >
              {item.type === "insurance" ? (
                <Shield className="w-3.5 h-3.5 text-amber-600" />
              ) : (
                <Check className="w-3.5 h-3.5 text-blue-600" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {item.action}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">{item.timeline}</span>
                {item.type === "insurance" && (
                  <span className="text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                    {t("insurance")}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
