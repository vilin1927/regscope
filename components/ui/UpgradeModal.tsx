"use client";

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Shield, TrendingUp, Users, Bell, FileSearch } from "lucide-react";
import { useTranslations } from "next-intl";
import type { TrialStatus, SubscriptionStatus } from "@/hooks/useSubscription";

interface UpgradeModalProps {
  trialStatus: TrialStatus;
  subscriptionStatus: SubscriptionStatus;
  onStartCheckout: (referralCode?: string) => Promise<void>;
  onStartTrial: () => void;
  onClose: () => void;
}

export function UpgradeModal({
  trialStatus,
  subscriptionStatus,
  onStartCheckout,
  onStartTrial,
  onClose,
}: UpgradeModalProps) {
  const t = useTranslations("Paywall");
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    setError(null);
    try {
      await onStartCheckout();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Checkout");
      setIsCheckingOut(false);
    }
  };

  const features = [
    { icon: FileSearch, text: t("proFeature1") },
    { icon: Shield, text: t("proFeature2") },
    { icon: TrendingUp, text: t("proFeature3") },
    { icon: Users, text: t("proFeature4") },
    { icon: Bell, text: t("proFeature5") },
  ];

  const showTrialOption = trialStatus === "none" && subscriptionStatus === "free";

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
        {/* Header with pricing */}
        <div className="p-6 text-white bg-gradient-to-br from-blue-600 to-blue-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">{t("proTitle")}</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Price display with monthly split */}
          <div className="mb-2">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">€195</span>
              <span className="text-blue-200 text-lg line-through">€270</span>
            </div>
            <p className="text-blue-100 text-sm mt-1">
              {t("priceSplit")}
            </p>
            <p className="text-blue-200 text-xs mt-1">
              {t("priceAfter")}
            </p>
          </div>
        </div>

        {/* Features / value highlights */}
        <div className="p-6">
          <p className="text-sm font-semibold text-gray-900 mb-3">
            {t("valueTitle")}
          </p>
          <ul className="space-y-3 mb-6">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm text-gray-700">{text}</span>
              </li>
            ))}
          </ul>

          {error && (
            <div className="mb-3 p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* CTA */}
          <motion.button
            onClick={handleCheckout}
            disabled={isCheckingOut}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-wait"
          >
            {isCheckingOut ? t("checkoutLoading") : t("upgradeCta")}
          </motion.button>

          <p className="text-xs text-gray-500 text-center mt-2">
            {t("securePayment")}
          </p>

          {/* Trial option for new users */}
          {showTrialOption && (
            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
              <button
                onClick={() => {
                  onStartTrial();
                  onClose();
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {t("tryFreeCta")}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
