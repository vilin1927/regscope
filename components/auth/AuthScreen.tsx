"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ScanSearch, Briefcase } from "lucide-react";
import { screenVariants, screenTransition } from "@/lib/motion";
import { useTranslations } from "next-intl";
import { AuthForm } from "./AuthForm";

interface AuthScreenProps {
  onAuth: (email: string, password: string, mode: "signin" | "signup") => Promise<void>;
  onGuest: () => void;
  onLegal: (page: "impressum" | "datenschutz") => void;
  onConsultantSignup?: () => void;
  error?: string;
}

export function AuthScreen({ onAuth, onGuest, onLegal, onConsultantSignup, error }: AuthScreenProps) {
  // Check for ?ref= param → auto-switch to signup
  const refFromUrl = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("ref") || ""
    : "";
  const [mode, setMode] = useState<"signin" | "signup">(refFromUrl ? "signup" : "signin");
  const t = useTranslations("Auth");
  const tLegal = useTranslations("Legal");

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 sm:p-6">
      <motion.div
        variants={screenVariants}
        initial="initial"
        animate="animate"
        transition={screenTransition}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ScanSearch className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("welcomeTitle")}
          </h1>
          <p className="text-gray-500 mt-1">{t("welcomeSubtitle")}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode("signin")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                mode === "signin"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {t("signIn")}
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                mode === "signup"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {t("signUp")}
            </button>
          </div>

          <AuthForm
            mode={mode}
            onSubmit={(email, password) => onAuth(email, password, mode)}
            error={error}
            initialReferralCode={refFromUrl}
          />

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={onGuest}
              className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              {t("guestMode")}
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              {t("guestNote")}
            </p>
          </div>
        </div>

        {/* Consultant direct signup link */}
        {onConsultantSignup && (
          <button
            onClick={onConsultantSignup}
            className="w-full mt-4 py-2.5 border border-blue-200 bg-blue-50 text-blue-700 rounded-xl font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <Briefcase className="w-4 h-4" />
            {t("consultantSignupLink")}
          </button>
        )}

        <div className="flex items-center justify-center gap-3 mt-6 text-xs text-gray-400">
          <button
            onClick={() => onLegal("impressum")}
            className="hover:text-gray-600 transition-colors"
          >
            {tLegal("impressum")}
          </button>
          <span>·</span>
          <button
            onClick={() => onLegal("datenschutz")}
            className="hover:text-gray-600 transition-colors"
          >
            {tLegal("datenschutz")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
