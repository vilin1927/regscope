"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, CheckCircle, Lock, Shield, Loader2 } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import type { TrialStatus } from "@/hooks/useSubscription";

interface UpgradeModalProps {
  trialStatus: TrialStatus;
  isGuest: boolean;
  onStartTrial: () => void;
  onRequestAuth: () => void;
  onClose: () => void;
}

export function UpgradeModal({
  trialStatus,
  isGuest,
  onStartTrial,
  onRequestAuth,
  onClose,
}: UpgradeModalProps) {
  const t = useTranslations("Paywall");
  const locale = useLocale();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

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

  const handleCheckout = useCallback(async () => {
    setIsCheckoutLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setIsCheckoutLoading(false);
      }
    } catch {
      setIsCheckoutLoading(false);
    }
  }, [locale]);

  const handleGuestUpgrade = () => {
    onRequestAuth();
  };

  const features = [
    t("proFeature1"),
    t("proFeature2"),
    t("proFeature3"),
    t("proFeature4"),
    t("proFeature5"),
  ];

  const isExpired = trialStatus === "expired";
  const canStartTrial = !isGuest && trialStatus === "none";
  const isAuthenticated = !isGuest;

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
              {/* Header */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-6 h-6" />
                    <h2 className="text-xl font-bold">{t("proTitle")}</h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-blue-100 text-sm mb-3">{t("proSubtitle")}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{t("proPricing")}</span>
                  <span className="text-blue-200 text-sm">{t("proPricingLabel")}</span>
                </div>
              </div>

              {/* Features */}
              <div className="p-6">
                {isExpired && (
                  <div className="flex items-center gap-2 mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                    <p className="text-sm text-amber-800">{t("trialExpiredMessage")}</p>
                  </div>
                )}

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

                {/* Primary CTA: Purchase */}
                {isAuthenticated ? (
                  <motion.button
                    onClick={handleCheckout}
                    disabled={isCheckoutLoading}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-3.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isCheckoutLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t("upgradeLoading")}
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        {t("upgradeCta")}
                      </>
                    )}
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={handleGuestUpgrade}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-3.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    {t("guestUpgradeCta")}
                  </motion.button>
                )}

                {/* Secondary CTA: Free trial (only for authenticated users who haven't tried yet) */}
                {canStartTrial && (
                  <button
                    onClick={handleStartTrial}
                    className="w-full mt-3 py-2.5 text-blue-600 text-sm font-medium hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    {t("startTrialCta")}
                  </button>
                )}

                {/* Trust badge */}
                <p className="text-xs text-gray-400 text-center mt-4">
                  {t("guaranteeText")}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
