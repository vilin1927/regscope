"use client";

import {
  LayoutDashboard,
  ScanSearch,
  History,
  ShieldAlert,
  Lightbulb,
  Mail,
  Settings,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { NavItem } from "./NavItem";

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

interface SidebarProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  hasResults: boolean;
  userEmail?: string;
  isGuest?: boolean;
}

export function Sidebar({
  currentScreen,
  onNavigate,
  hasResults,
  userEmail,
  isGuest,
}: SidebarProps) {
  const t = useTranslations("Nav");
  const tApp = useTranslations("App");

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
            <ScanSearch className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900">{tApp("name")}</h1>
            <p className="text-xs text-gray-500">{tApp("tagline")}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          {t("compliance")}
        </p>
        <NavItem
          icon={LayoutDashboard}
          label={t("dashboard")}
          active={
            currentScreen === "dashboard" || currentScreen === "results"
          }
          onClick={() =>
            onNavigate(hasResults ? "results" : "dashboard")
          }
        />
        <NavItem
          icon={ScanSearch}
          label={t("newScan")}
          active={
            currentScreen === "questionnaire" ||
            currentScreen === "processing"
          }
          onClick={() => onNavigate("questionnaire")}
        />
        <NavItem
          icon={History}
          label={t("scanHistory")}
          active={currentScreen === "scan-history"}
          onClick={() => onNavigate("scan-history")}
        />

        <p className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          {t("analysis")}
        </p>
        <NavItem
          icon={ShieldAlert}
          label={t("riskAnalysis")}
          badge={t("inPreparation")}
          active={currentScreen === "risk-analysis"}
          onClick={() => onNavigate("risk-analysis")}
        />
        <NavItem
          icon={Lightbulb}
          label={t("recommendations")}
          badge={t("inPreparation")}
          active={currentScreen === "recommendations"}
          onClick={() => onNavigate("recommendations")}
        />
        <NavItem
          icon={Mail}
          label={t("newsletter")}
          badge={t("inPreparation")}
          active={currentScreen === "newsletter"}
          onClick={() => onNavigate("newsletter")}
        />

        <p className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          {t("system")}
        </p>
        <NavItem
          icon={Settings}
          label={t("settings")}
          active={currentScreen === "settings"}
          onClick={() => onNavigate("settings")}
        />
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-blue-600">
              {isGuest ? "G" : (userEmail?.[0] || "U").toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {isGuest ? "Gast" : userEmail || "User"}
            </p>
            {isGuest && (
              <p className="text-xs text-gray-500">Gastmodus</p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
