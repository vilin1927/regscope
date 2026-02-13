"use client";

import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "@/src/i18n/navigation";

interface SettingsScreenProps {
  userEmail?: string;
  isGuest?: boolean;
  onSignOut?: () => void;
  onLegal?: (page: "impressum" | "datenschutz") => void;
}

export function SettingsScreen({
  userEmail,
  isGuest,
  onSignOut,
  onLegal,
}: SettingsScreenProps) {
  const t = useTranslations("Settings");
  const tAuth = useTranslations("Auth");
  const tLegal = useTranslations("Legal");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const setLocale = (next: string) => {
    router.replace(pathname, { locale: next });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto"
    >
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("title")}</h1>

      {/* Language */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <h2 className="font-semibold text-gray-900 mb-4">{t("language")}</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setLocale("de")}
            className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${
              locale === "de"
                ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                : "bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200"
            }`}
          >
            {t("german")}
          </button>
          <button
            onClick={() => setLocale("en")}
            className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${
              locale === "en"
                ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                : "bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200"
            }`}
          >
            {t("english")}
          </button>
        </div>
      </div>

      {/* Account */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">{t("account")}</h2>
        {isGuest ? (
          <p className="text-sm text-gray-500">{tAuth("guestNote")}</p>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">{tAuth("email")}</p>
              <p className="font-medium text-gray-900">
                {userEmail || "—"}
              </p>
            </div>
            {onSignOut && (
              <button
                onClick={onSignOut}
                className="px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
              >
                {tAuth("signOut")}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Legal */}
      {onLegal && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mt-4">
          <h2 className="font-semibold text-gray-900 mb-4">{t("legal")}</h2>
          <div className="flex gap-3">
            <button
              onClick={() => onLegal("impressum")}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              {tLegal("impressum")}
            </button>
            <span className="text-gray-300">·</span>
            <button
              onClick={() => onLegal("datenschutz")}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              {tLegal("datenschutz")}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
