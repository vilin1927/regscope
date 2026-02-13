"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { FieldRenderer } from "./FieldRenderer";
import type {
  QuestionnaireLayer,
  BusinessProfile,
} from "@/data/questionnaire/types";

interface LayerRendererProps {
  layer: QuestionnaireLayer;
  answers: BusinessProfile;
  onUpdate: (fieldId: string, value: unknown) => void;
  errors?: Record<string, string>;
}

function evaluateCondition(
  condition: { field: string; operator: string; value: unknown },
  answers: BusinessProfile
): boolean {
  const fieldValue = answers[condition.field];

  switch (condition.operator) {
    case "eq":
      return fieldValue === condition.value;
    case "in": {
      const arr = condition.value as unknown[];
      return arr.includes(fieldValue);
    }
    case "gt":
      return Number(fieldValue) > Number(condition.value);
    case "includes": {
      const selected = (fieldValue as string[]) || [];
      return selected.includes(condition.value as string);
    }
    case "true":
      return fieldValue === true;
    default:
      return false;
  }
}

export function LayerRenderer({
  layer,
  answers,
  onUpdate,
  errors = {},
}: LayerRendererProps) {
  const t = useTranslations("Questionnaire");

  // Split fields: regular fields and compliance-check toggles
  const regularFields = layer.fields.filter((f) => !f.isComplianceCheck);
  const complianceFields = layer.fields.filter((f) => f.isComplianceCheck);

  const layerKey = `layer${layer.id}` as const;

  return (
    <motion.div
      key={layer.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      {/* Layer header */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">{t(`${layerKey}.title`)}</h2>
        <p className="text-sm text-gray-500">{t(`${layerKey}.subtitle`)}</p>
      </div>

      {/* Regular fields */}
      {regularFields.map((field) => (
        <FieldRenderer
          key={field.id}
          field={field}
          value={answers[field.id]}
          onChange={(value) => onUpdate(field.id, value)}
          error={errors[field.id]}
        />
      ))}

      {/* Compliance check section */}
      {complianceFields.length > 0 && (
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            {t("complianceChecksSection")}
          </p>
          <div className="grid grid-cols-1 gap-3">
            {complianceFields.map((field) => (
              <FieldRenderer
                key={field.id}
                field={field}
                value={answers[field.id]}
                onChange={(value) => onUpdate(field.id, value)}
                error={errors[field.id]}
              />
            ))}
          </div>
        </div>
      )}

      {/* Conditional fields */}
      {layer.conditionalFields?.map((cf) => {
        if (!evaluateCondition(cf.showWhen, answers)) return null;
        return (
          <FieldRenderer
            key={cf.field.id}
            field={cf.field}
            value={answers[cf.field.id]}
            onChange={(value) => onUpdate(cf.field.id, value)}
            error={errors[cf.field.id]}
          />
        );
      })}
    </motion.div>
  );
}
