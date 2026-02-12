"use client";

import { motion } from "framer-motion";
import { ChevronRight, ScanSearch, FileText, Clock } from "lucide-react";
import { useTranslations } from "next-intl";

interface DashboardScreenProps {
  onStartScan: () => void;
  scanCount?: number;
  lastScanDate?: string;
  regulationsFound?: number;
}

export function DashboardScreen({
  onStartScan,
  scanCount = 0,
  lastScanDate,
  regulationsFound = 0,
}: DashboardScreenProps) {
  const t = useTranslations("Dashboard");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto"
    >
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {t("welcome")}
      </h1>
      <p className="text-gray-600 mb-8">{t("subtitle")}</p>

      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 text-white mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2">{t("startScan")}</h2>
            <p className="text-blue-100 mb-6 max-w-md">
              {t("startScanDesc")}
            </p>
            <button
              onClick={onStartScan}
              className="inline-flex items-center gap-2 bg-white text-blue-700 px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              {t("startScan")} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="hidden md:flex w-24 h-24 bg-white/10 rounded-2xl items-center justify-center">
            <ScanSearch className="w-12 h-12 text-white/50" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          {
            v: String(regulationsFound),
            l: t("regulationsFound"),
            i: FileText,
          },
          {
            v: String(scanCount),
            l: t("scansCompleted"),
            i: ScanSearch,
          },
          {
            v: lastScanDate || t("noScansYet"),
            l: t("lastScan"),
            i: Clock,
          },
        ].map((s) => (
          <div
            key={s.l}
            className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4"
          >
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
              <s.i className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.v}</p>
              <p className="text-sm text-gray-500">{s.l}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
