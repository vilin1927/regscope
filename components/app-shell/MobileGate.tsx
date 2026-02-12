"use client";

import { Monitor } from "lucide-react";
import { useTranslations } from "next-intl";

export function MobileGate() {
  const t = useTranslations("Mobile");

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-8 max-w-sm text-center shadow-lg border border-gray-100">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Monitor className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">{t("title")}</h1>
        <p className="text-gray-600">{t("description")}</p>
      </div>
    </div>
  );
}
