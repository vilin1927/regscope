"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Lock } from "lucide-react";
import { RegulationCard } from "./RegulationCard";
import { ScrollableRow } from "@/components/ui/ScrollableRow";
import { ExpertAvatar } from "@/components/ui/ExpertAvatar";
import { getExpertForCategory } from "@/data/experts";
import type { MatchedRegulation } from "@/data/regulations/types";
import type { RegulationCategory } from "@/data/regulations/types";

function parsePenaltyAmount(penalty: string): number {
  const matches = penalty.match(/[\d.]+/g);
  if (!matches) return 0;
  // Take the largest number (e.g., "bis 50.000" → 50000)
  return Math.max(...matches.map((m) => parseInt(m.replace(/\./g, ""), 10) || 0));
}

function formatPenalty(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1).replace(/\.0$/, "")} Mio. €`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0).replace(/\.0$/, "")}.000 €`;
  return `${amount} €`;
}

interface RegulationListProps {
  regulations: MatchedRegulation[];
  complianceChecks: Record<string, boolean>;
  onComplianceChange: (regulationId: string, checked: boolean) => void;
  onExpertContact?: (categoryKey: RegulationCategory) => void;
  activeTags?: string[];
  isPro?: boolean;
  onUnlock?: () => void;
}

const categoryOrder: RegulationCategory[] = [
  "arbeitssicherheit",
  "arbeitsrecht",
  "gewerberecht",
  "umweltrecht",
  "produktsicherheit",
  "datenschutz",
  "versicherungspflichten",
];

export function RegulationList({
  regulations,
  complianceChecks,
  onComplianceChange,
  onExpertContact,
  activeTags = [],
  isPro = true,
  onUnlock,
}: RegulationListProps) {
  const t = useTranslations("Results");
  const tExpert = useTranslations("Expert");
  const tExperts = useTranslations("Experts");
  const tPaywall = useTranslations("Paywall");
  const [activeTab, setActiveTab] = useState<string>("all");

  const grouped = categoryOrder
    .map((cat) => ({
      category: cat,
      items: regulations.filter((r) => r.category === cat),
    }))
    .filter((g) => g.items.length > 0);

  const visibleGroups =
    activeTab === "all"
      ? grouped
      : grouped.filter((g) => g.category === activeTab);

  // Calculate total hidden regulations and penalty sum for unlock CTA
  const { hiddenCount, totalPenalty } = useMemo(() => {
    let hidden = 0;
    let penalty = 0;
    for (const group of visibleGroups) {
      if (!isPro && group.items.length > 1) {
        const hiddenItems = group.items.slice(1);
        hidden += hiddenItems.length;
        for (const item of hiddenItems) {
          penalty += parsePenaltyAmount(item.potentialPenalty);
        }
      }
    }
    return { hiddenCount: hidden, totalPenalty: penalty };
  }, [visibleGroups, isPro]);

  let cardIndex = 0;

  return (
    <div>
      {/* Category tabs */}
      <ScrollableRow className="flex items-center gap-2 mb-6 pb-1">
        <button
          onClick={() => setActiveTab("all")}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
            activeTab === "all"
              ? "bg-blue-600 text-white"
              : "bg-white border border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600"
          }`}
        >
          {t("allCategories")} ({regulations.length})
        </button>
        {grouped.map((group) => (
          <button
            key={group.category}
            onClick={() => setActiveTab(group.category)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === group.category
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600"
            }`}
          >
            {t(`category.${group.category}`)} ({group.items.length})
          </button>
        ))}
      </ScrollableRow>

      {/* Regulation cards */}
      <div className="space-y-6">
        {visibleGroups.map((group) => {
          const expert = getExpertForCategory(group.category);
          return (
            <div key={group.category}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900">
                    {t(`category.${group.category}`)}
                  </h2>
                  <span className="text-sm text-gray-500">
                    ({group.items.length})
                  </span>
                </div>
                {/* Expert contact chip — only show if active consultant exists for this category */}
                {onExpertContact && activeTags.includes(group.category) && (
                  <button
                    onClick={() => onExpertContact(group.category)}
                    className="inline-flex items-center gap-2.5 pl-1.5 pr-3.5 py-1.5 bg-white border border-gray-200 rounded-full text-sm hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <ExpertAvatar expert={expert} size="sm" />
                    <div className="text-left">
                      <p className="text-xs font-semibold text-gray-900 leading-tight">
                        {tExperts(`${expert.i18nKey}.name`)}
                      </p>
                      <p className="text-[11px] text-blue-600 leading-tight">
                        {tExpert("consultExpert")}
                      </p>
                    </div>
                  </button>
                )}
              </div>

              <div className="space-y-4 ml-0">
                {group.items.map((reg, i) => {
                  const idx = cardIndex++;
                  // Free users: only first item per category is visible
                  if (!isPro && i > 0) return null;
                  return (
                    <RegulationCard
                      key={reg.id}
                      regulation={reg}
                      index={idx}
                      complianceChecked={complianceChecks[reg.id] || false}
                      onComplianceChange={(checked) =>
                        onComplianceChange(reg.id, checked)
                      }
                    />
                  );
                })}
                {/* Freemium unlock CTA for remaining cards */}
                {!isPro && group.items.length > 1 && (() => {
                  const groupHidden = group.items.length - 1;
                  const groupPenalty = group.items
                    .slice(1)
                    .reduce((sum, item) => sum + parsePenaltyAmount(item.potentialPenalty), 0);
                  return (
                    <button
                      onClick={onUnlock}
                      className="w-full rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/50 p-5 text-center hover:bg-blue-50 hover:border-blue-400 transition-all group active:scale-[0.99]"
                    >
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Lock className="w-4 h-4 text-blue-600" />
                        <p className="text-sm font-semibold text-blue-700">
                          {groupPenalty > 0
                            ? tPaywall("moreRegulationsWithPenalty", {
                                count: groupHidden,
                                penalty: formatPenalty(groupPenalty),
                              })
                            : tPaywall("moreRegulations", { count: groupHidden })}
                        </p>
                      </div>
                      <p className="text-xs text-blue-500 group-hover:text-blue-600 font-medium">
                        {tPaywall("unlockAll")}
                      </p>
                    </button>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
