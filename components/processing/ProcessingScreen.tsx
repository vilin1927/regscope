"use client";

import { motion } from "framer-motion";
import { Loader2, Check } from "lucide-react";
import { useTranslations } from "next-intl";

interface ProcessingScreenProps {
  currentStep: number;
}

export function ProcessingScreen({ currentStep }: ProcessingScreenProps) {
  const t = useTranslations("Processing");

  const steps = [
    t("step1"),
    t("step2"),
    t("step3"),
    t("step4"),
    t("step5"),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="max-w-md mx-auto text-center py-12"
    >
      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">{t("title")}</h2>
      <p className="text-gray-500 mb-8">{t("subtitle")}</p>
      <div className="space-y-3 text-left">
        {steps.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: currentStep >= i ? 1 : 0.4, x: 0 }}
            transition={{ delay: i * 0.2 }}
            className={`flex items-center gap-3 p-3 rounded-lg ${
              currentStep > i
                ? "bg-green-50"
                : currentStep === i
                  ? "bg-blue-50"
                  : "bg-gray-50"
            }`}
          >
            {currentStep > i ? (
              <Check className="w-5 h-5 text-green-600" />
            ) : currentStep === i ? (
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
            )}
            <span
              className={`text-sm ${currentStep >= i ? "text-gray-900" : "text-gray-400"}`}
            >
              {s}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
