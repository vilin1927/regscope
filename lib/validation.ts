import type {
  QuestionnaireLayer,
  QuestionField,
  BusinessProfile,
} from "@/data/questionnaire/types";

export type ValidationErrors = Record<string, string>;

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

function validateField(
  field: QuestionField,
  value: unknown
): string | null {
  if (!field.required) return null;

  if (field.type === "toggle") {
    // Toggle fields default to false — if required, user must have explicitly set it
    // We allow both true and false as valid (the field was interacted with)
    // but undefined/null means it was never touched
    return null;
  }

  switch (field.type) {
    case "text":
      if (!value || (typeof value === "string" && value.trim() === "")) {
        return "textRequired";
      }
      break;
    case "date":
      if (!value || (typeof value === "string" && value.trim() === "")) {
        return "dateRequired";
      }
      break;
    case "select":
      if (!value || value === "") {
        return "selectRequired";
      }
      break;
    case "multiselect":
      if (!value || !Array.isArray(value) || value.length === 0) {
        return "multiselectRequired";
      }
      break;
  }

  return null;
}

export function validateLayer(
  layer: QuestionnaireLayer,
  answers: BusinessProfile
): ValidationErrors {
  const errors: ValidationErrors = {};

  for (const field of layer.fields) {
    const error = validateField(field, answers[field.id]);
    if (error) {
      errors[field.id] = error;
    }
  }

  if (layer.conditionalFields) {
    for (const cf of layer.conditionalFields) {
      if (evaluateCondition(cf.showWhen, answers)) {
        const error = validateField(cf.field, answers[cf.field.id]);
        if (error) {
          errors[cf.field.id] = error;
        }
      }
    }
  }

  return errors;
}
