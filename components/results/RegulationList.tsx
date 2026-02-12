"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { RegulationCard } from "./RegulationCard";
import type { MatchedRegulation } from "@/data/regulations/matching-engine";
import type { RegulationCategory } from "@/data/regulations/types";

interface RegulationListProps {
  regulations: MatchedRegulation[];
  complianceChecks: Record<string, boolean>;
  onComplianceChange: (regulationId: string, checked: boolean) => void;
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
}: RegulationListProps) {
  const t = useTranslations("Results");
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
              {group.items.map((reg) => {
                const idx = cardIndex++;
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
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
