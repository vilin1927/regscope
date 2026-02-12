"use client";

import { useTranslations } from "next-intl";
import type { MatchedRegulation } from "@/data/regulations/matching-engine";

interface RiskAnalysisMockupProps {
  regulations?: MatchedRegulation[];
}

export function RiskAnalysisMockup({ regulations }: RiskAnalysisMockupProps) {
  const t = useTranslations("Mockups.riskAnalysis");
  const tResults = useTranslations("Results");

  const rows = regulations?.slice(0, 6).map((reg) => ({
    reg: reg.name,
    severity: reg.riskLevel,
    gap:
      reg.status === "fehlend"
        ? reg.keyRequirements[0] || "—"
        : reg.status === "pruefung"
          ? "Prüfung erforderlich"
          : "—",
    deadline: "Q2 2026",
    penalty: reg.potentialPenalty,
  })) || [
    {
      reg: "ArbSchG",
      severity: "hoch" as const,
      gap: "Keine Gefährdungsbeurteilung durchgeführt",
      deadline: "Q2 2026",
      penalty: "Bußgeld bis 25.000€",
    },
    {
      reg: "DGUV Vorschrift 1",
      severity: "hoch" as const,
      gap: "Sicherheitsunterweisung fehlt",
      deadline: "Q2 2026",
      penalty: "Bußgeld bis 10.000€",
    },
    {
      reg: "GefStoffV",
      severity: "mittel" as const,
      gap: "Gefahrstoffverzeichnis unvollständig",
      deadline: "Q3 2026",
      penalty: "Bußgeld bis 50.000€",
    },
    {
      reg: "DSGVO",
      severity: "niedrig" as const,
      gap: "Verarbeitungsverzeichnis prüfen",
      deadline: "Q4 2026",
      penalty: "Bis 20 Mio. € oder 4% Umsatz",
    },
  ];

  const severityColor = (s: string) => {
    if (s === "hoch") return "bg-red-100 text-red-700";
    if (s === "mittel") return "bg-amber-100 text-amber-700";
    return "bg-green-100 text-green-700";
  };

  const severityLabel = (s: string) => {
    if (s === "hoch") return tResults("risk.high");
    if (s === "mittel") return tResults("risk.medium");
    return tResults("risk.low");
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 font-semibold text-gray-700">
              {t("regulation")}
            </th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">
              {t("severity")}
            </th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">
              {t("gap")}
            </th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">
              {t("deadline")}
            </th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">
              {t("penalty")}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.reg}
              className="border-b border-gray-100 last:border-0"
            >
              <td className="px-4 py-3 font-medium text-gray-900">
                {r.reg}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${severityColor(r.severity)}`}
                >
                  {severityLabel(r.severity)}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600">{r.gap}</td>
              <td className="px-4 py-3 text-gray-600">{r.deadline}</td>
              <td className="px-4 py-3 text-gray-600">{r.penalty}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
