"use client";

import { useRef, useEffect } from "react";
import { X, Check } from "lucide-react";
import { useTranslations } from "next-intl";

interface UpgradeModalProps {
  onUpgrade: () => void;
  onClose: () => void;
}

export function UpgradeModal({ onUpgrade, onClose }: UpgradeModalProps) {
  const t = useTranslations("Paywall");
  const overlayRef = useRef<HTMLDivElement>(null);

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

  const features = [
    t("proFeature1"),
    t("proFeature2"),
    t("proFeature3"),
    t("proFeature4"),
  ];

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">{t("proTitle")}</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-blue-100 mb-1">{t("proSubtitle")}</p>
          <p className="text-2xl font-bold">{t("proPricing")}</p>
        </div>

        <div className="p-6">
          <ul className="space-y-3 mb-6">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-sm text-gray-700">{f}</span>
              </li>
            ))}
          </ul>
          <button
            onClick={() => {
              onUpgrade();
              onClose();
            }}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            {t("upgradeCta")}
          </button>
        </div>
      </div>
    </div>
  );
}
