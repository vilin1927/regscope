"use client";

import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/src/i18n/navigation";
import { useLocale } from "next-intl";

type Screen =
  | "auth"
  | "dashboard"
  | "questionnaire"
  | "processing"
  | "results"
  | "scan-history"
  | "risk-analysis"
  | "newsletter"
  | "recommendations"
  | "settings";

interface HeaderProps {
  currentScreen: Screen;
}

const screenTitleKeys: Record<Screen, string> = {
  auth: "Nav.dashboard",
  dashboard: "Nav.dashboard",
  questionnaire: "Nav.newScan",
  processing: "Processing.title",
  results: "Results.title",
  "scan-history": "ScanHistory.title",
  "risk-analysis": "Mockups.riskAnalysis.title",
  newsletter: "Mockups.newsletter.title",
  recommendations: "Mockups.recommendations.title",
  settings: "Settings.title",
};

export function Header({ currentScreen }: HeaderProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLocale = () => {
    const next = locale === "de" ? "en" : "de";
    router.replace(pathname, { locale: next });
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <span className="text-sm font-medium text-gray-900">
        {t(screenTitleKeys[currentScreen])}
      </span>
      <button
        onClick={toggleLocale}
        className="text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
      >
        {locale === "de" ? "EN" : "DE"}
      </button>
    </header>
  );
}
