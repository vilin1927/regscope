"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronRight, ScanSearch, FileText } from "lucide-react";
import { screenVariants, screenTransition } from "@/lib/motion";
import { useTranslations } from "next-intl";
import { ComplianceScoreWidget } from "./ComplianceScoreWidget";
import { ScanTabs } from "./ScanTabs";
import { CategoryBreakdown } from "./CategoryBreakdown";
import { HowToImprove } from "./HowToImprove";
import { useScanContext } from "@/components/providers/ScanProvider";
import type { MatchedRegulation } from "@/data/regulations/types";

interface DashboardScreenProps {
  onStartScan: () => void;
  onViewResults: (scanId: string) => void;
}

export function DashboardScreen({ onStartScan, onViewResults }: DashboardScreenProps) {
  const {
    scanHistory,
    complianceChecks,
    getComplianceChecksForScan,
  } = useScanContext();
  const t = useTranslations("Dashboard");

  // Selected scan for dashboard display
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  const [selectedChecks, setSelectedChecks] = useState<Record<string, boolean>>({});

  // Auto-select most recent scan
  useEffect(() => {
    if (scanHistory.length > 0 && !selectedScanId) {
      setSelectedScanId(scanHistory[0].id);
    }
  }, [scanHistory, selectedScanId]);

  // Load compliance checks when selected scan changes
  useEffect(() => {
    if (!selectedScanId) return;
    let cancelled = false;
    getComplianceChecksForScan(selectedScanId).then((checks) => {
      if (!cancelled) setSelectedChecks(checks);
    });
    return () => { cancelled = true; };
  }, [selectedScanId, getComplianceChecksForScan, complianceChecks]);

  const selectedScan = scanHistory.find((s) => s.id === selectedScanId);
  const selectedRegulations: MatchedRegulation[] = selectedScan?.matchedRegulations ?? [];
  const checkedCount = Object.values(selectedChecks).filter(Boolean).length;
  const totalCount = selectedRegulations.length;
  const score = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  const hasScans = scanHistory.length > 0;

  return (
    <motion.div
      variants={screenVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={screenTransition}
      className="max-w-4xl mx-auto"
    >
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {t("welcome")}
      </h1>
      <p className="text-gray-600 mb-8">{t("subtitle")}</p>

      {/* Start Scan CTA */}
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

      {/* Scan Tabs + Per-Scan Dashboard — only when scans exist */}
      {hasScans && (
        <>
          <ScanTabs
            scans={scanHistory}
            selectedScanId={selectedScanId}
            onSelect={setSelectedScanId}
            onNewScan={onStartScan}
          />

          {selectedScan && totalCount > 0 && (
            <>
              <ComplianceScoreWidget
                score={score}
                regulationCount={totalCount}
                checkedCount={checkedCount}
              />

              <HowToImprove
                score={score}
                lowestCategory={(() => {
                  if (selectedRegulations.length === 0) return undefined;
                  const cats = selectedRegulations.reduce<Record<string, { checked: number; total: number }>>((acc, reg) => {
                    if (!acc[reg.category]) acc[reg.category] = { checked: 0, total: 0 };
                    acc[reg.category].total++;
                    if (selectedChecks[reg.id]) acc[reg.category].checked++;
                    return acc;
                  }, {});
                  let lowest: { name: string; checked: number; total: number } | undefined;
                  for (const [cat, data] of Object.entries(cats)) {
                    const pct = data.total > 0 ? data.checked / data.total : 1;
                    if (!lowest || pct < (lowest.total > 0 ? lowest.checked / lowest.total : 1)) {
                      lowest = { name: cat, ...data };
                    }
                  }
                  return lowest;
                })()}
                onViewResults={() => onViewResults(selectedScanId!)}
              />

              <button
                onClick={() => onViewResults(selectedScanId!)}
                className="w-full mb-6 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                {t("viewFullResults")}
              </button>

              <CategoryBreakdown
                regulations={selectedRegulations}
                complianceChecks={selectedChecks}
              />
            </>
          )}
        </>
      )}
    </motion.div>
  );
}
