"use client";

import {
  LayoutDashboard,
  ScanSearch,
  History,
  ShieldAlert,
  Lightbulb,
  Mail,
  Settings,
  Send,
  Users,
  FileText,
  X,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { NavItem } from "./NavItem";
import { useSubscriptionContext } from "@/components/providers/SubscriptionProvider";
import type { Screen } from "@/types";

interface SidebarProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  userEmail?: string;
  isGuest?: boolean;
  open: boolean;
  onClose: () => void;
}

export function Sidebar({
  currentScreen,
  onNavigate,
  userEmail,
  isGuest,
  open,
  onClose,
}: SidebarProps) {
  const t = useTranslations("Nav");
  const tApp = useTranslations("App");
  const tPaywall = useTranslations("Paywall");
  const { plan, trialStatus } = useSubscriptionContext();

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
            <ScanSearch className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-900">{tApp("name")}</h1>
            <p className="text-xs text-gray-500">{tApp("tagline")}</p>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
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
          active={currentScreen === "dashboard"}
          onClick={() => onNavigate("dashboard")}
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
          active={currentScreen === "scan-history" || currentScreen === "results"}
          onClick={() => onNavigate("scan-history")}
        />

        <p className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          {t("analysis")}
        </p>
        <NavItem
          icon={ShieldAlert}
          label={t("riskAnalysis")}
          active={currentScreen === "risk-analysis"}
          onClick={() => onNavigate("risk-analysis")}
        />
        <NavItem
          icon={Lightbulb}
          label={t("recommendations")}
          active={currentScreen === "recommendations"}
          onClick={() => onNavigate("recommendations")}
        />
        <NavItem
          icon={Mail}
          label={t("newsletter")}
          active={currentScreen === "newsletter"}
          onClick={() => onNavigate("newsletter")}
        />

        {(process.env.NEXT_PUBLIC_ADMIN_EMAIL || "").split(",").map((e) => e.trim().toLowerCase()).includes(userEmail?.toLowerCase() || "") && (
          <>
            <p className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              {t("admin")}
            </p>
            <NavItem
              icon={Send}
              label={t("newsletterSend")}
              active={currentScreen === "admin-newsletter"}
              onClick={() => onNavigate("admin-newsletter")}
            />
            <NavItem
              icon={Users}
              label={t("adminUsers")}
              active={currentScreen === "admin-users"}
              onClick={() => onNavigate("admin-users")}
            />
            <NavItem
              icon={FileText}
              label={t("adminTemplates")}
              active={currentScreen === "admin-templates"}
              onClick={() => onNavigate("admin-templates")}
            />
          </>
        )}

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

      {/* User section — pinned to bottom */}
      <div className="shrink-0 p-4 border-t border-gray-100 mt-auto">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-blue-600">
              {isGuest ? "G" : (userEmail?.[0] || "U").toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-900 truncate">
                {isGuest ? "Gast" : userEmail || "User"}
              </p>
              {/* Plan badge */}
              {plan === "pro" ? (
                <span className="inline-flex items-center gap-0.5 shrink-0 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase">
                  <Sparkles className="w-2.5 h-2.5" />
                  {tPaywall("pro")}
                </span>
              ) : (
                <span className="shrink-0 px-1.5 py-0.5 bg-gray-200 text-gray-600 text-[10px] font-bold rounded-full uppercase">
                  {tPaywall("free")}
                </span>
              )}
            </div>
            {isGuest && (
              <p className="text-xs text-gray-500">Gastmodus</p>
            )}
            {plan === "pro" && trialStatus === "active" && (
              <p className="text-[10px] text-blue-500 font-medium">
                {tPaywall("trialActive")}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar — always visible, pinned to viewport height */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile drawer — overlay */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />
          {/* Drawer */}
          <aside className="relative w-64 max-w-[80vw] h-full bg-white flex flex-col shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
