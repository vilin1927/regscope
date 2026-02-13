"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";

interface LegalScreenProps {
  page: "impressum" | "datenschutz";
  onBack: () => void;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>
      <div className="text-sm text-gray-700 leading-relaxed">{children}</div>
    </div>
  );
}

function ImpressumContent() {
  const t = useTranslations("Legal.impressumContent");
  return (
    <>
      <Section title={t("subtitle")}>
        <p className="font-semibold">{t("company")}</p>
        <p className="whitespace-pre-line mt-1">{t("address")}</p>
      </Section>
      <Section title={t("represented")}>
        <p>{t("representedName")}</p>
      </Section>
      <Section title={t("contact")}>
        <p>{t("email")}</p>
      </Section>
      <Section title={t("register")}>
        <p>{t("registerInfo")}</p>
      </Section>
      <Section title={t("vatId")}>
        <p>{t("vatIdInfo")}</p>
      </Section>
      <Section title={t("liability")}>
        <p>{t("liabilityText")}</p>
      </Section>
      <Section title={t("copyright")}>
        <p>{t("copyrightText")}</p>
      </Section>
    </>
  );
}

function DatenschutzContent() {
  const t = useTranslations("Legal.datenschutzContent");
  return (
    <>
      <Section title={t("subtitle")}>
        <p className="whitespace-pre-line">{t("responsibleText")}</p>
      </Section>
      <Section title={t("dataCollection")}>
        <p className="mb-2">{t("dataCollectionText")}</p>
        <ul className="list-disc list-inside space-y-1">
          {t("dataPoints")
            .split("\n")
            .map((point, i) => (
              <li key={i}>{point}</li>
            ))}
        </ul>
      </Section>
      <Section title={t("purpose")}>
        <p>{t("purposeText")}</p>
      </Section>
      <Section title={t("storage")}>
        <p>{t("storageText")}</p>
      </Section>
      <Section title={t("rights")}>
        <p>{t("rightsText")}</p>
      </Section>
      <Section title={t("cookies")}>
        <p>{t("cookiesText")}</p>
      </Section>
      <Section title={t("changes")}>
        <p>{t("changesText")}</p>
      </Section>
    </>
  );
}

export function LegalScreen({ page, onBack }: LegalScreenProps) {
  const t = useTranslations("Legal");
  const title =
    page === "impressum"
      ? t("impressumContent.title")
      : t("datenschutzContent.title");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl mx-auto"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("back")}
      </button>

      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{title}</h1>
        {page === "impressum" ? <ImpressumContent /> : <DatenschutzContent />}
      </div>
    </motion.div>
  );
}
