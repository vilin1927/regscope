"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ScanSearch } from "lucide-react";
import { useTranslations } from "next-intl";
import { AuthForm } from "./AuthForm";

interface AuthScreenProps {
  onAuth: (email: string, password: string, mode: "signin" | "signup") => Promise<void>;
  onGuest: () => void;
  error?: string;
}

export function AuthScreen({ onAuth, onGuest, error }: AuthScreenProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const t = useTranslations("Auth");

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
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
      </motion.div>
    </div>
  );
}
