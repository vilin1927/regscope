/** Expertise tags that match compliance scan categories */
export const EXPERTISE_TAGS = [
  "arbeitssicherheit",
  "arbeitsrecht",
  "gewerberecht",
  "umweltrecht",
  "produktsicherheit",
  "datenschutz",
  "versicherungspflichten",
  "steuerrecht",
  "baurecht",
  "lebensmittelrecht",
  "handelsrecht",
] as const;

export type ExpertiseTag = (typeof EXPERTISE_TAGS)[number];

/** German labels for each tag */
export const EXPERTISE_TAG_LABELS: Record<ExpertiseTag, string> = {
  arbeitssicherheit: "Arbeitssicherheit",
  arbeitsrecht: "Arbeitsrecht",
  gewerberecht: "Gewerberecht",
  umweltrecht: "Umweltrecht",
  produktsicherheit: "Produktsicherheit",
  datenschutz: "Datenschutz",
  versicherungspflichten: "Versicherungspflichten",
  steuerrecht: "Steuerrecht",
  baurecht: "Baurecht",
  lebensmittelrecht: "Lebensmittelrecht",
  handelsrecht: "Handelsrecht",
};

export interface Consultant {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  tags: string[];
  referral_code: string;
  commission_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Referral {
  id: string;
  referral_code: string;
  consultant_id: string;
  customer_user_id: string;
  status: "active" | "converted" | "expired";
  created_at: string;
}

export interface HelpRequest {
  id: string;
  customer_user_id: string;
  consultant_id: string | null;
  category: string;
  message?: string;
  status: "pending" | "contacted" | "resolved" | "cancelled";
  contact_revealed: boolean;
  customer_email?: string;
  customer_phone?: string;
  created_at: string;
  updated_at: string;
}
