"use client";

import { motion } from "framer-motion";
import { ScanSearch } from "lucide-react";
import { useTranslations } from "next-intl";
import { ScanHistoryCard } from "./ScanHistoryCard";
import type { ScanRecord } from "@/types";

interface ScanHistoryScreenProps {
  scans: ScanRecord[];
  onViewScan: (scanId: string) => void;
  onRerunScan: (scanId: string) => void;
  onStartScan: () => void;
}

export function ScanHistoryScreen({
  scans,
  onViewScan,
  onRerunScan,
  onStartScan,
}: ScanHistoryScreenProps) {
  const t = useTranslations("ScanHistory");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto"
    >
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("title")}</h1>
      <p className="text-gray-600 mb-6">{t("subtitle")}</p>

      {scans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ScanSearch className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {t("noScans")}
          </h2>
          <p className="text-gray-500 mb-6">{t("noScansDesc")}</p>
          <button
            onClick={onStartScan}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            {t("rerun")}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {scans.map((scan) => (
            <ScanHistoryCard
              key={scan.id}
              id={scan.id}
              companyName={scan.companyName}
              date={scan.date}
              regulationCount={scan.regulationCount}
              complianceScore={scan.complianceScore}
              onView={() => onViewScan(scan.id)}
              onRerun={() => onRerunScan(scan.id)}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
