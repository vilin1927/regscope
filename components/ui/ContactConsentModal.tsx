"use client";

import { useState, useRef } from "react";
import { Shield } from "lucide-react";
import { useTranslations } from "next-intl";

interface ContactConsentModalProps {
  onAccept: () => void;
  onDecline: () => void;
}

export function ContactConsentModal({ onAccept, onDecline }: ContactConsentModalProps) {
  const [checked, setChecked] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("ContactConsent");

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onDecline();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">{t("title")}</h2>
          </div>

          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            {t("body")}
          </p>

          <label className="flex items-start gap-3 cursor-pointer mb-6 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0"
            />
            <span className="text-sm font-medium text-gray-700">
              {t("checkbox")}
            </span>
          </label>

          <div className="flex gap-3">
            <button
              onClick={onDecline}
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              {t("decline")}
            </button>
            <button
              onClick={onAccept}
              disabled={!checked}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t("accept")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
