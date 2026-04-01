"use client";

import { XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface CheckoutCancelScreenProps {
  onNavigate: (screen: "dashboard") => void;
}

export function CheckoutCancelScreen({ onNavigate }: CheckoutCancelScreenProps) {
  const t = useTranslations("Paywall");

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md px-4">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t("checkoutCancelTitle")}
        </h1>
        <p className="text-gray-600 mb-6">
          {t("checkoutCancelMessage")}
        </p>
        <button
          onClick={() => onNavigate("dashboard")}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          {t("backToDashboard")}
        </button>
      </div>
    </div>
  );
}
