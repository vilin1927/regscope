"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { RegulationCard } from "./RegulationCard";
import type { MatchedRegulation } from "@/data/regulations/types";
import type { RegulationCategory } from "@/data/regulations/types";

interface RegulationListProps {
  regulations: MatchedRegulation[];
  complianceChecks: Record<string, boolean>;
  onComplianceChange: (regulationId: string, checked: boolean) => void;
  onExpertContact?: (category: string) => void;
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
  isPro = true,
  onUnlock,
}: RegulationListProps) {
  const t = useTranslations("Results");
  const tExpert = useTranslations("Expert");
  const tPaywall = useTranslations("Paywall");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const grouped = categoryOrder
    .map((cat) => ({
      category: cat,
      items: regulations.filter((r) => r.category === cat),
    }))
    .filter((g) => g.items.length > 0);

  const toggle = (cat: string) =>
    setCollapsed((p) => ({ ...p, [cat]: !p[cat] }));

  let cardIndex = 0;

  return (
    <div className="space-y-6">
      {grouped.map((group) => (
        <div key={group.category}>
          <button
            onClick={() => toggle(group.category)}
            className="flex items-center gap-2 mb-3 group"
          >
            {collapsed[group.category] ? (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
            <h2 className="text-lg font-bold text-gray-900">
              {t(`category.${group.category}`)}
            </h2>
            <span className="text-sm text-gray-500">
              ({group.items.length})
            </span>
          </button>

          {!collapsed[group.category] && (
            <div className="space-y-4 ml-7">
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
              {/* Freemium blur overlay for remaining cards */}
              {!isPro && group.items.length > 1 && (
                <div className="relative rounded-xl border border-gray-200 bg-white p-6 text-center">
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-xl" />
                  <div className="relative z-10">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      {tPaywall("moreRegulations", { count: group.items.length - 1 })}
                    </p>
                    <button
                      onClick={onUnlock}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      {tPaywall("unlockAll")}
                    </button>
                  </div>
                </div>
              )}
              {/* Expert contact button per category */}
              {onExpertContact && (
                <button
                  onClick={() =>
                    onExpertContact(t(`category.${group.category}`))
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 border border-blue-200 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  {tExpert("consultExpert")}
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
