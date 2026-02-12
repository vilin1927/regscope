"use client";

import { motion } from "framer-motion";
import { Check, AlertTriangle, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { ComplianceCheckbox } from "../ui/ComplianceCheckbox";
import type { MatchedRegulation } from "@/data/regulations/matching-engine";

interface RegulationCardProps {
  regulation: MatchedRegulation;
  index: number;
  complianceChecked: boolean;
  onComplianceChange: (checked: boolean) => void;
}

export function RegulationCard({
  regulation,
  index,
  complianceChecked,
  onComplianceChange,
}: RegulationCardProps) {
  const t = useTranslations("Results");

  const riskColors = {
    hoch: "bg-red-100 text-red-700",
    mittel: "bg-amber-100 text-amber-700",
    niedrig: "bg-green-100 text-green-700",
  };

  const statusColors = {
    erfuellt: "bg-green-100 text-green-700",
    pruefung: "bg-amber-100 text-amber-700",
    fehlend: "bg-red-100 text-red-700",
  };

  const jurisdictionColors = {
    eu: "bg-blue-100 text-blue-700",
    bund: "bg-indigo-100 text-indigo-700",
    land: "bg-purple-100 text-purple-700",
    branche: "bg-cyan-100 text-cyan-700",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
    >
      {/* Header badges */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <h3 className="font-bold text-gray-900">{regulation.name}</h3>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${jurisdictionColors[regulation.jurisdiction]}`}
        >
          {t(`jurisdiction.${regulation.jurisdiction}`)}
        </span>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${riskColors[regulation.riskLevel]}`}
        >
          {t(`risk.${regulation.riskLevel}`)}
        </span>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[regulation.status]}`}
        >
          {t(`status.${regulation.status === "erfuellt" ? "fulfilled" : regulation.status === "pruefung" ? "review" : "missing"}`)}
        </span>
      </div>

      <p className="text-sm text-gray-500 mb-3">
        {regulation.officialReference}
      </p>
      <p className="text-gray-600 mb-4">{regulation.summary}</p>

      {/* Key requirements */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">
          {t("keyRequirements")}
        </p>
        <ul className="space-y-1">
          {regulation.keyRequirements.map((req, j) => (
            <li
              key={j}
              className="text-sm text-gray-600 flex items-start gap-2"
            >
              <Check className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              {req}
            </li>
          ))}
        </ul>
      </div>

      {/* Penalty */}
      <div className="mb-4 p-3 bg-red-50 rounded-lg flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
        <p className="text-sm text-red-800">
          <strong>{t("potentialPenalty")}:</strong>{" "}
          {regulation.potentialPenalty}
        </p>
      </div>

      {/* Why applies */}
      <div className="bg-blue-50 rounded-lg p-3 mb-4">
        <p className="text-sm text-blue-800">
          <strong>{t("whyApplies")}:</strong> {regulation.whyApplies}
        </p>
      </div>

      {/* Footer: checkbox + source */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <ComplianceCheckbox
          checked={complianceChecked}
          onChange={onComplianceChange}
          label={t("status.fulfilled")}
        />
        <a
          href={regulation.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          {t("viewSource")} <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </motion.div>
  );
}
