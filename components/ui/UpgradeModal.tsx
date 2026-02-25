"use client";

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Clock, CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { TrialStatus } from "@/hooks/useSubscription";

interface UpgradeModalProps {
  trialStatus: TrialStatus;
  onStartTrial: () => void;
  onClose: () => void;
}

export function UpgradeModal({ trialStatus, onStartTrial, onClose }: UpgradeModalProps) {
  const t = useTranslations("Paywall");
  const overlayRef = useRef<HTMLDivElement>(null);
  const [showSuccess, setShowSuccess] = useState(false);

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

  const handleStartTrial = () => {
    onStartTrial();
    setShowSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const features = [
    t("proFeature1"),
    t("proFeature2"),
    t("proFeature3"),
    t("proFeature4"),
  ];

  const isExpired = trialStatus === "expired";

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
        className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
              className="p-10 text-center bg-gradient-to-br from-green-500 to-emerald-600"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1, duration: 0.5, bounce: 0.4 }}
              >
                <CheckCircle className="w-16 h-16 text-white mx-auto mb-4" />
              </motion.div>
              <p className="text-xl font-bold text-white mb-1">
                {t("trialStarted")}
              </p>
              <p className="text-green-100 text-sm">
                {t("trialPricing")}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              <div
                className={`p-6 text-white ${
                  isExpired
                    ? "bg-gradient-to-br from-gray-600 to-gray-700"
                    : "bg-gradient-to-br from-blue-600 to-blue-700"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">{t("proTitle")}</h2>
                  <button
                    onClick={onClose}
                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {isExpired ? (
                  <>
                    <p className="text-gray-200 mb-1">{t("trialExpiredSubtitle")}</p>
                    <p className="text-2xl font-bold">{t("proPricing")}</p>
                  </>
                ) : (
                  <>
                    <p className="text-blue-100 mb-1">{t("trialSubtitle")}</p>
                    <p className="text-2xl font-bold">{t("trialPricing")}</p>
                  </>
                )}
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

                {isExpired ? (
                  <div>
                    <div className="flex items-center gap-2 mb-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <p className="text-sm text-amber-800">{t("trialExpiredMessage")}</p>
                    </div>
                    <button
                      onClick={onClose}
                      className="w-full py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                      {t("contactSales")}
                    </button>
                  </div>
                ) : (
                  <div>
                    <motion.button
                      onClick={handleStartTrial}
                      whileTap={{ scale: 0.97 }}
                      className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      {t("startTrialCta")}
                    </motion.button>
                    <p className="text-xs text-gray-500 text-center mt-2">
                      {t("noCardRequired")}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
