"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/src/i18n/navigation";
import { useLocale } from "next-intl";
import type { Screen } from "@/types";

interface HeaderProps {
  currentScreen: Screen;
  onMenuToggle?: () => void;
}

const screenTitleKeys: Record<Screen, string> = {
  auth: "Nav.dashboard",
  dashboard: "Nav.dashboard",
  "company-search": "CompanySearch.title",
  questionnaire: "Nav.newScan",
  processing: "Processing.title",
  results: "Results.title",
  "scan-history": "ScanHistory.title",
  "risk-analysis": "RiskAnalysis.title",
  newsletter: "Newsletter.title",
  recommendations: "Recommendations.title",
  "admin-newsletter": "Admin.newsletter",
  "admin-users": "Admin.users",
  settings: "Settings.title",
  impressum: "Legal.impressum",
  datenschutz: "Legal.datenschutz",
};

export function Header({ currentScreen, onMenuToggle }: HeaderProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLocale = () => {
    const next = locale === "de" ? "en" : "de";
    router.replace(pathname, { locale: next });
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        )}
        <span className="text-sm font-medium text-gray-900">
          {t(screenTitleKeys[currentScreen])}
        </span>
      </div>
      <button
        onClick={toggleLocale}
        className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
      >
        <span className="text-base leading-none">{locale === "de" ? "🇬🇧" : "🇩🇪"}</span>
        <span>{locale === "de" ? "EN" : "DE"}</span>
      </button>
    </header>
  );
}
