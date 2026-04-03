import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/db/auth-checks";
import { db } from "@/lib/db";
import { consultants, referrals, helpRequests } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

// GET — admin: list all consultants with referral counts
export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    // All consultants
    const allConsultants = await db
      .select()
      .from(consultants)
      .orderBy(desc(consultants.createdAt));

    // All referrals for counting
    const allReferrals = await db
      .select({
        consultantId: referrals.consultantId,
      })
      .from(referrals);

    const countMap: Record<string, number> = {};
    allReferrals.forEach((r) => {
      countMap[r.consultantId] = (countMap[r.consultantId] || 0) + 1;
    });

    // All help requests for counting
    const allHelpRequests = await db
      .select({
        consultantId: helpRequests.consultantId,
        status: helpRequests.status,
      })
      .from(helpRequests);

    const helpMap: Record<string, { total: number; pending: number }> = {};
    allHelpRequests.forEach((h) => {
      if (!h.consultantId) return;
      if (!helpMap[h.consultantId])
        helpMap[h.consultantId] = { total: 0, pending: 0 };
      helpMap[h.consultantId].total++;
      if (h.status === "pending") helpMap[h.consultantId].pending++;
    });

    const enriched = allConsultants.map((c) => ({
      ...c,
      referral_count: countMap[c.id] || 0,
      help_request_count: helpMap[c.id]?.total || 0,
      pending_requests: helpMap[c.id]?.pending || 0,
    }));

    return NextResponse.json({ consultants: enriched });
  } catch (error) {
    console.error("Admin consultants error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}

// PATCH — admin: update consultant (commission rate, active status)
export async function PATCH(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const body = await request.json();
    const {
      consultantId,
      commission_rate_initial,
      commission_rate_recurring,
      is_active,
    } = body;

    if (!consultantId) {
      return NextResponse.json(
        { error: "Berater-ID erforderlich" },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (commission_rate_initial !== undefined)
      updates.commissionRateInitial = String(commission_rate_initial);
    if (commission_rate_recurring !== undefined)
      updates.commissionRateRecurring = String(commission_rate_recurring);
    if (is_active !== undefined) updates.isActive = is_active;

    const [updated] = await db
      .update(consultants)
      .set(updates)
      .where(eq(consultants.id, consultantId))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Berater nicht gefunden" },
        { status: 404 }
      );
    }

    return NextResponse.json({ consultant: updated });
  } catch (error) {
    console.error("Admin consultant update error:", error);
    return NextResponse.json(
      { error: "Aktualisierung fehlgeschlagen" },
      { status: 500 }
    );
  }
}
