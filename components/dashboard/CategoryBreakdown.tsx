"use client";

import { useTranslations } from "next-intl";
import type { MatchedRegulation } from "@/data/regulations/types";

interface CategoryBreakdownProps {
  regulations: MatchedRegulation[];
  complianceChecks: Record<string, boolean>;
}

export function CategoryBreakdown({
  regulations,
  complianceChecks,
}: CategoryBreakdownProps) {
  const t = useTranslations("Dashboard");
  const tCat = useTranslations("Results.category");

  // Group regulations by category
  const categories = regulations.reduce<
    Record<string, { total: number; checked: number }>
  >((acc, reg) => {
    if (!acc[reg.category]) {
      acc[reg.category] = { total: 0, checked: 0 };
    }
    acc[reg.category].total++;
    if (complianceChecks[reg.id]) {
      acc[reg.category].checked++;
    }
    return acc;
  }, {});

  const entries = Object.entries(categories).sort(
    (a, b) => b[1].total - a[1].total
  );

  if (entries.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">
        {t("categoryBreakdown")}
      </h3>
      <div className="space-y-3">
        {entries.map(([category, { total, checked }]) => {
          const pct = total > 0 ? Math.round((checked / total) * 100) : 0;
          return (
            <div key={category}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700">
                  {tCat(category)}
                </span>
                <span className="text-xs text-gray-500">
                  {checked}/{total}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
