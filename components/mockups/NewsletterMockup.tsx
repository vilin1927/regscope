"use client";

import { ScanSearch } from "lucide-react";
import { useTranslations } from "next-intl";
import type { MatchedRegulation } from "@/data/regulations/matching-engine";

interface NewsletterMockupProps {
  regulations?: MatchedRegulation[];
}

export function NewsletterMockup({ regulations }: NewsletterMockupProps) {
  const t = useTranslations("Mockups.newsletter");
  const tApp = useTranslations("App");

  const items = regulations?.slice(0, 3).map((reg) => ({
    title: `${reg.name} — Änderungen prüfen`,
    tag:
      reg.riskLevel === "hoch"
        ? "Frist"
        : reg.riskLevel === "mittel"
          ? "Aktualisierung"
          : "Info",
    tagCls:
      reg.riskLevel === "hoch"
        ? "bg-red-100 text-red-700"
        : reg.riskLevel === "mittel"
          ? "bg-amber-100 text-amber-700"
          : "bg-blue-100 text-blue-700",
  })) || [
    {
      title: "ArbSchG — Neue Anforderungen an Gefährdungsbeurteilung",
      tag: "Aktualisierung",
      tagCls: "bg-amber-100 text-amber-700",
    },
    {
      title: "DGUV Regel 109-606 — Umsetzungsfrist nähert sich",
      tag: "Frist",
      tagCls: "bg-red-100 text-red-700",
    },
    {
      title: "VerpackG — Neue Registrierungspflichten",
      tag: "Info",
      tagCls: "bg-blue-100 text-blue-700",
    },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-blue-600 px-5 py-3 flex items-center gap-2">
          <ScanSearch className="w-4 h-4 text-white" />
          <span className="text-white font-bold text-sm">
            {tApp("name")}
          </span>
        </div>
        <div className="p-5">
          <h3 className="font-bold text-gray-900 mb-3">
            {t("weeklyUpdate")}
          </h3>
          {items.map((item) => (
            <div
              key={item.title}
              className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
            >
              <span className="text-sm text-gray-700">{item.title}</span>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.tagCls}`}
              >
                {item.tag}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          {t("frequency")}
        </span>
        <div className="flex gap-2">
          {[t("weekly"), t("monthly")].map((f, i) => (
            <button
              key={f}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium ${
                i === 0
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <button
        className="w-full py-2.5 bg-gray-200 text-gray-400 rounded-lg font-medium cursor-not-allowed"
        disabled
      >
        {t("sendTest")}
      </button>
    </div>
  );
}
