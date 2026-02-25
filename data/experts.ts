import type { RegulationCategory } from "@/data/regulations/types";

export type ExpertCategoryKey = RegulationCategory | "general";

export interface ExpertProfile {
  id: ExpertCategoryKey;
  i18nKey: string;
  initials: string;
  avatarColor: string;
  avatarSrc?: string;
}

export const EXPERT_PROFILES: Record<ExpertCategoryKey, ExpertProfile> = {
  arbeitssicherheit: {
    id: "arbeitssicherheit",
    i18nKey: "arbeitssicherheit",
    initials: "KW",
    avatarColor: "bg-red-100 text-red-700",
    avatarSrc: "/experts/klaus-weber.jpg",
  },
  arbeitsrecht: {
    id: "arbeitsrecht",
    i18nKey: "arbeitsrecht",
    initials: "SB",
    avatarColor: "bg-blue-100 text-blue-700",
    avatarSrc: "/experts/sabine-braun.jpg",
  },
  gewerberecht: {
    id: "gewerberecht",
    i18nKey: "gewerberecht",
    initials: "MH",
    avatarColor: "bg-emerald-100 text-emerald-700",
    avatarSrc: "/experts/martin-hoffmann.jpg",
  },
  umweltrecht: {
    id: "umweltrecht",
    i18nKey: "umweltrecht",
    initials: "AF",
    avatarColor: "bg-green-100 text-green-700",
    avatarSrc: "/experts/andrea-fischer.jpg",
  },
  produktsicherheit: {
    id: "produktsicherheit",
    i18nKey: "produktsicherheit",
    initials: "TR",
    avatarColor: "bg-purple-100 text-purple-700",
    avatarSrc: "/experts/thomas-richter.jpg",
  },
  datenschutz: {
    id: "datenschutz",
    i18nKey: "datenschutz",
    initials: "LK",
    avatarColor: "bg-indigo-100 text-indigo-700",
    avatarSrc: "/experts/laura-klein.jpg",
  },
  versicherungspflichten: {
    id: "versicherungspflichten",
    i18nKey: "versicherungspflichten",
    initials: "JN",
    avatarColor: "bg-amber-100 text-amber-700",
    avatarSrc: "/experts/jens-neumann.jpg",
  },
  general: {
    id: "general",
    i18nKey: "general",
    initials: "FS",
    avatarColor: "bg-gray-100 text-gray-700",
    avatarSrc: "/experts/frank-schneider.jpg",
  },
};

export function getExpertForCategory(key: ExpertCategoryKey): ExpertProfile {
  return EXPERT_PROFILES[key] ?? EXPERT_PROFILES.general;
}
