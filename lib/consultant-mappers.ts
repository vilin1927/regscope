import type { consultants, referrals, helpRequests } from "@/lib/db/schema";
import type { InferSelectModel } from "drizzle-orm";
import type { Consultant, Referral, HelpRequest } from "@/lib/consultant-types";

type ConsultantRow = InferSelectModel<typeof consultants>;
type ReferralRow = InferSelectModel<typeof referrals>;
type HelpRequestRow = InferSelectModel<typeof helpRequests>;

// Drizzle returns camelCase; UI/types expect snake_case. Map at the API boundary.
export function toConsultant(c: ConsultantRow): Consultant {
  return {
    id: c.id,
    user_id: c.userId,
    name: c.name,
    email: c.email,
    phone: c.phone ?? undefined,
    bio: c.bio ?? undefined,
    tags: c.tags ?? [],
    referral_code: c.referralCode,
    commission_rate_initial: Number(c.commissionRateInitial),
    commission_rate_recurring: Number(c.commissionRateRecurring),
    is_active: c.isActive,
    created_at: c.createdAt instanceof Date ? c.createdAt.toISOString() : String(c.createdAt),
    updated_at: c.updatedAt instanceof Date ? c.updatedAt.toISOString() : String(c.updatedAt),
  };
}

export function toReferral(r: ReferralRow): Referral {
  return {
    id: r.id,
    referral_code: r.referralCode,
    consultant_id: r.consultantId,
    customer_user_id: r.customerUserId,
    status: r.status as Referral["status"],
    created_at: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
  };
}

export function toHelpRequest(h: HelpRequestRow): HelpRequest {
  return {
    id: h.id,
    customer_user_id: h.customerUserId,
    consultant_id: h.consultantId,
    category: h.category,
    message: h.message ?? undefined,
    status: h.status as HelpRequest["status"],
    contact_revealed: h.contactRevealed,
    customer_email: h.customerEmail ?? undefined,
    customer_phone: h.customerPhone ?? undefined,
    created_at: h.createdAt instanceof Date ? h.createdAt.toISOString() : String(h.createdAt),
    updated_at: h.updatedAt instanceof Date ? h.updatedAt.toISOString() : String(h.updatedAt),
  };
}
