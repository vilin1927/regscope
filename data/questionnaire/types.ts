export interface QuestionField {
  id: string;
  type: "text" | "date" | "select" | "multiselect" | "toggle";
  label: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  required: boolean;
  isComplianceCheck: boolean;
}

export interface ConditionalField {
  field: QuestionField;
  showWhen: {
    field: string;
    operator: "eq" | "in" | "gt" | "includes" | "true";
    value: unknown;
  };
}

export interface QuestionnaireLayer {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  optional: boolean;
  fields: QuestionField[];
  conditionalFields?: ConditionalField[];
}

export type BusinessProfile = Record<string, unknown>;
