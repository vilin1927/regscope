"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { ElementType, ReactNode } from "react";

interface InPrepScreenProps {
  icon: ElementType;
  color: string;
  title: string;
  description: string;
  mockup?: ReactNode;
}

const colorMap: Record<string, { bg: string; text: string; badge: string }> = {
  red: {
    bg: "bg-red-100",
    text: "text-red-600",
    badge: "bg-red-100 text-red-700 border-red-200",
  },
  blue: {
    bg: "bg-blue-100",
    text: "text-blue-600",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
  },
  amber: {
    bg: "bg-amber-100",
    text: "text-amber-600",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
  },
  gray: {
    bg: "bg-gray-100",
    text: "text-gray-600",
    badge: "bg-gray-100 text-gray-700 border-gray-200",
  },
};

export function InPrepScreen({
  icon: Icon,
  color,
  title,
  description,
  mockup,
}: InPrepScreenProps) {
  const t = useTranslations("Mockups");
  const c = colorMap[color] || colorMap.gray;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl mx-auto"
    >
      <div className="flex items-center gap-3 mb-6">
        <div
          className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center`}
        >
          <Icon className={`w-6 h-6 ${c.text}`} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <span
            className={`inline-block mt-1 text-xs font-bold px-2.5 py-1 rounded-full border ${c.badge}`}
          >
            {t("inPreparation")} — {t("comingInV2")}
          </span>
        </div>
      </div>
      <p className="text-gray-600 mb-8 leading-relaxed">{description}</p>
      {mockup && <div className="mb-6">{mockup}</div>}
    </motion.div>
  );
}
