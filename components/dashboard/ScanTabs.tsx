"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { ScrollableRow } from "@/components/ui/ScrollableRow";
import type { ScanRecord } from "@/types";

interface ScanTabsProps {
  scans: ScanRecord[];
  selectedScanId: string | null;
  onSelect: (scanId: string) => void;
  onNewScan: () => void;
}

export function ScanTabs({
  scans,
  selectedScanId,
  onSelect,
  onNewScan,
}: ScanTabsProps) {
  const t = useTranslations("Dashboard");

  if (scans.length === 0) return null;

  return (
    <ScrollableRow className="flex items-center gap-2 mb-6 pb-1">
      {scans.map((scan) => {
        const isSelected = scan.id === selectedScanId;
        return (
          <button
            key={scan.id}
            onClick={() => onSelect(scan.id)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              isSelected
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600"
            }`}
          >
            {scan.companyName} &middot; {scan.date} &middot;{" "}
            {scan.regulationCount} {t("regulationsShort")}
          </button>
        );
      })}
      <button
        onClick={onNewScan}
        className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-white border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        {t("newScanTab")}
      </button>
    </ScrollableRow>
  );
}
