"use client";

import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface CheckoutSuccessScreenProps {
  onNavigate: (screen: "dashboard") => void;
}

export function CheckoutSuccessScreen({ onNavigate }: CheckoutSuccessScreenProps) {
  const t = useTranslations("Paywall");
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onNavigate("dashboard");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onNavigate]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md px-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t("checkoutSuccessTitle")}
        </h1>
        <p className="text-gray-600 mb-6">
          {t("checkoutSuccessMessage")}
        </p>
        <button
          onClick={() => onNavigate("dashboard")}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          {t("backToDashboard")} ({countdown}s)
        </button>
      </div>
    </div>
  );
}
