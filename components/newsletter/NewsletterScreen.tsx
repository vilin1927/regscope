"use client";

import { motion } from "framer-motion";
import { Mail, ScanSearch, Loader2, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useNewsletterPreferences } from "@/hooks/useNewsletterPreferences";
import type { RegulationCategory } from "@/data/regulations/types";
import type { NewsletterFrequency } from "@/types/addons";

interface NewsletterScreenProps {
  userId?: string;
  isGuest?: boolean;
}

const COMPLIANCE_AREAS: RegulationCategory[] = [
  "arbeitssicherheit",
  "arbeitsrecht",
  "gewerberecht",
  "umweltrecht",
  "produktsicherheit",
  "datenschutz",
  "versicherungspflichten",
];

export function NewsletterScreen({ userId, isGuest }: NewsletterScreenProps) {
  const t = useTranslations("Newsletter");
  const tCat = useTranslations("Results.category");
  const tApp = useTranslations("App");
  const { preferences, isLoading, isSaving, error, update } =
    useNewsletterPreferences(userId);

  // Guest gate
  if (isGuest || !userId) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="max-w-2xl mx-auto"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">{t("authRequired")}</p>
        </div>
      </motion.div>
    );
  }

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="max-w-2xl mx-auto"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <Loader2 className="w-8 h-8 text-blue-500 mx-auto mb-3 animate-spin" />
          <p className="text-gray-500 text-sm">{t("loading")}</p>
        </div>
      </motion.div>
    );
  }

  const toggleArea = (area: RegulationCategory) => {
    const current = preferences.areas;
    const next = current.includes(area)
      ? current.filter((a) => a !== area)
      : [...current, area];
    update({ areas: next });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
          <Mail className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-gray-500 text-sm mt-1">{t("description")}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Opt-in toggle */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">{t("optIn")}</h2>
            <p className="text-sm text-gray-500 mt-1">{t("optInDesc")}</p>
          </div>
          <button
            onClick={() => update({ optedIn: !preferences.optedIn })}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              preferences.optedIn ? "bg-blue-600" : "bg-gray-300"
            }`}
          >
            <div
              className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                preferences.optedIn ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Frequency */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4">
        <h2 className="font-semibold text-gray-900 mb-3">{t("frequency")}</h2>
        <div className="flex gap-3">
          {(["weekly", "monthly"] as NewsletterFrequency[]).map((freq) => (
            <button
              key={freq}
              onClick={() => update({ frequency: freq })}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                preferences.frequency === freq
                  ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                  : "bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200"
              }`}
            >
              {t(freq)}
            </button>
          ))}
        </div>
      </div>

      {/* Areas */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4">
        <h2 className="font-semibold text-gray-900 mb-3">{t("areas")}</h2>
        <p className="text-sm text-gray-500 mb-4">{t("areasDesc")}</p>
        <div className="space-y-2">
          {COMPLIANCE_AREAS.map((area) => {
            const isSelected = preferences.areas.includes(area);
            return (
              <button
                key={area}
                onClick={() => toggleArea(area)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-left transition-colors ${
                  isSelected
                    ? "bg-blue-50 text-blue-800 border border-blue-200"
                    : "bg-gray-50 text-gray-700 border border-transparent hover:bg-gray-100"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                    isSelected
                      ? "bg-blue-600"
                      : "border-2 border-gray-300"
                  }`}
                >
                  {isSelected && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
                {tCat(area)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Saving indicator */}
      {isSaving && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t("saving")}
        </div>
      )}

      {/* Newsletter preview */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 mb-3">{t("preview")}</h2>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-blue-600 px-5 py-3 flex items-center gap-2">
            <ScanSearch className="w-4 h-4 text-white" />
            <span className="text-white font-bold text-sm">
              {tApp("name")}
            </span>
          </div>
          <div className="p-5">
            <h3 className="font-bold text-gray-900 mb-3">
              {preferences.frequency === "weekly"
                ? t("weeklyUpdate")
                : t("monthlyUpdate")}
            </h3>
            <div className="space-y-3">
              {[
                {
                  title: t("previewItem1"),
                  tag: t("previewTag1"),
                  tagCls: "bg-red-100 text-red-700",
                },
                {
                  title: t("previewItem2"),
                  tag: t("previewTag2"),
                  tagCls: "bg-amber-100 text-amber-700",
                },
                {
                  title: t("previewItem3"),
                  tag: t("previewTag3"),
                  tagCls: "bg-blue-100 text-blue-700",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <span className="text-sm text-gray-700">{item.title}</span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.tagCls}`}
                  >
                    {item.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
