"use client";

import { useTranslations } from "next-intl";
import { Toggle } from "../ui/Toggle";
import type { QuestionField } from "@/data/questionnaire/types";

interface FieldRendererProps {
  field: QuestionField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
}

export function FieldRenderer({ field, value, onChange, error }: FieldRendererProps) {
  const t = useTranslations("Questionnaire");

  const label = t.has(`fields.${field.id}.label`)
    ? t(`fields.${field.id}.label`)
    : field.label;

  const placeholder = t.has(`fields.${field.id}.placeholder`)
    ? t(`fields.${field.id}.placeholder`)
    : field.placeholder || "";

  const getOptionLabel = (optValue: string, fallback: string) => {
    const key = `fields.${field.id}.options.${optValue}`;
    return t.has(key) ? t(key) : fallback;
  };

  switch (field.type) {
    case "text":
      return (
        <div id={`field-${field.id}`}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {field.required && <span className="text-red-500 ml-1 text-xs font-bold" title={t("required")}>*</span>}
          </label>
          <input
            type="text"
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
              error ? "border-red-500 bg-red-50" : "border-gray-300"
            }`}
            placeholder={placeholder}
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
      );

    case "date":
      return (
        <div id={`field-${field.id}`}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {field.required && <span className="text-red-500 ml-1 text-xs font-bold" title={t("required")}>*</span>}
          </label>
          <input
            type="date"
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
              error ? "border-red-500 bg-red-50" : "border-gray-300"
            }`}
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
      );

    case "select":
      return (
        <div id={`field-${field.id}`}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {field.required && <span className="text-red-500 ml-1 text-xs font-bold" title={t("required")}>*</span>}
          </label>
          <select
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white ${
              error ? "border-red-500 bg-red-50" : "border-gray-300"
            }`}
          >
            <option value="">{t("selectPlaceholder")}</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {getOptionLabel(opt.value, opt.label)}
              </option>
            ))}
          </select>
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
      );

    case "multiselect": {
      const selected = (value as string[]) || [];
      return (
        <div id={`field-${field.id}`}>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {label}
            {field.required && <span className="text-red-500 ml-1 text-xs font-bold" title={t("required")}>*</span>}
          </label>
          <div className={`flex flex-wrap gap-2 ${
            error ? "rounded-lg border-2 border-red-500 p-2" : ""
          }`}>
            {field.options?.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  const next = selected.includes(opt.value)
                    ? selected.filter((v) => v !== opt.value)
                    : [...selected, opt.value];
                  onChange(next);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selected.includes(opt.value)
                    ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                    : "bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200"
                }`}
              >
                {getOptionLabel(opt.value, opt.label)}
              </button>
            ))}
          </div>
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
      );
    }

    case "toggle":
      return (
        <div id={`field-${field.id}`}>
          <Toggle
            label={label}
            checked={(value as boolean) || false}
            onChange={(v) => onChange(v)}
            isComplianceCheck={field.isComplianceCheck}
          />
        </div>
      );

    default:
      return null;
  }
}
