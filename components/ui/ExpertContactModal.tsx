"use client";

import { useState, useRef, useEffect } from "react";
import { X, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { getExpertForCategory, type ExpertCategoryKey } from "@/data/experts";
import { ExpertAvatar } from "./ExpertAvatar";

interface ExpertContactModalProps {
  categoryKey: ExpertCategoryKey;
  onClose: () => void;
}

export function ExpertContactModal({
  categoryKey,
  onClose,
}: ExpertContactModalProps) {
  const t = useTranslations("Expert");
  const tExperts = useTranslations("Experts");
  const [sent, setSent] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const expert = getExpertForCategory(categoryKey);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  const bioText = tExperts(`${expert.i18nKey}.bio`);

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 pb-0">
          <h2 className="text-lg font-bold text-gray-900">
            {t("modalTitle")}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {sent ? (
          <div className="p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-lg font-semibold text-gray-900 mb-1">
              {t("successTitle")}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              {t("successMessage")}
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {t("close")}
            </button>
          </div>
        ) : (
          <>
            {/* Expert profile header */}
            <div className="px-6 pt-5 pb-4">
              <div className="flex items-center gap-4">
                <ExpertAvatar expert={expert} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-900">
                    {tExperts(`${expert.i18nKey}.name`)}
                  </p>
                  <p className="text-sm font-medium text-blue-600">
                    {tExperts(`${expert.i18nKey}.title`)}
                  </p>
                  {/* Collapsible bio */}
                  <div className="mt-1">
                    <p
                      className={`text-xs text-gray-500 ${bioExpanded ? "" : "line-clamp-2"}`}
                    >
                      {bioText}
                    </p>
                    <button
                      type="button"
                      onClick={() => setBioExpanded(!bioExpanded)}
                      className="inline-flex items-center gap-0.5 text-xs text-blue-500 hover:text-blue-700 mt-0.5 transition-colors"
                    >
                      {bioExpanded ? (
                        <>
                          {t("less")}
                          <ChevronUp className="w-3 h-3" />
                        </>
                      ) : (
                        <>
                          {t("more")}
                          <ChevronDown className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-100 mt-4 pt-3">
                <p className="text-sm font-medium text-gray-700">
                  {tExperts("fillFormHeading")}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("name")}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t("namePlaceholder")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("email")}
                </label>
                <input
                  type="email"
                  required
                  placeholder={t("emailPlaceholder")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("category")}
                </label>
                <input
                  type="text"
                  readOnly
                  value={tExperts(`${expert.i18nKey}.title`)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("message")}
                </label>
                <textarea
                  rows={3}
                  placeholder={t("messagePlaceholder")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                {t("send")}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
