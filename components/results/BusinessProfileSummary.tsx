"use client";

import { useTranslations } from "next-intl";
import type { BusinessProfile } from "@/data/questionnaire/types";

interface BusinessProfileSummaryProps {
  profile: BusinessProfile;
}

export function BusinessProfileSummary({
  profile,
}: BusinessProfileSummaryProps) {
  const t = useTranslations("Results");

  const companyName =
    (profile.companyName as string) || "Ihr Betrieb";
  const industry = (profile.industry as string) || "Tischlerei";
  const bundesland = (profile.bundesland as string) || "";
  const employeeCount = (profile.employeeCount as string) || "0";
  const legalForm = (profile.legalForm as string) || "";
  const isPlanning = profile.noCompanyYet === true;

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 mb-6 text-white">
      <h2 className="text-lg font-bold mb-3">{t("businessProfile")}</h2>
      <p className="text-gray-300 leading-relaxed">
        <strong className="text-white">{companyName}</strong>{" "}
        {isPlanning ? "plant eine" : "ist eine"}{" "}
        <strong className="text-white">{industry}</strong>
        {legalForm && ` (${legalForm})`}
        {bundesland && (
          <>
            {" "}
            in <strong className="text-white">{bundesland}</strong>
          </>
        )}
        {employeeCount !== "0" && (
          <>
            {" "}
            mit <strong className="text-white">{employeeCount}</strong>{" "}
            Mitarbeitern
          </>
        )}
        .
      </p>
    </div>
  );
}
