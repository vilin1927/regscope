import { NextResponse } from "next/server";
import { requireAuth, verifyConsultantOwnership } from "@/lib/db/auth-checks";
import { db } from "@/lib/db";
import { consultants, referrals, helpRequests } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

// GET — consultant dashboard data (referrals, help requests, stats)
export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { userId } = auth;

    const consultantId = await verifyConsultantOwnership(userId);
    if (!consultantId) {
      return NextResponse.json(
        { error: "Kein Beraterprofil gefunden" },
        { status: 404 }
      );
    }

    // Get consultant profile
    const [consultant] = await db
      .select()
      .from(consultants)
      .where(eq(consultants.userId, userId))
      .limit(1);

    // Get referrals
    const referralList = await db
      .select()
      .from(referrals)
      .where(eq(referrals.consultantId, consultantId))
      .orderBy(desc(referrals.createdAt));

    // Get help requests
    const helpRequestList = await db
      .select()
      .from(helpRequests)
      .where(eq(helpRequests.consultantId, consultantId))
      .orderBy(desc(helpRequests.createdAt));

    // Calculate stats
    const totalReferrals = referralList.length;
    const activeReferrals = referralList.filter((r) => r.status === "active").length;
    const pendingRequests = helpRequestList.filter((r) => r.status === "pending").length;
    const totalRequests = helpRequestList.length;

    return NextResponse.json({
      consultant,
      referrals: referralList,
      helpRequests: helpRequestList,
      stats: {
        totalReferrals,
        activeReferrals,
        pendingRequests,
        totalRequests,
      },
    });
  } catch (err) {
    console.error("Consultant dashboard error:", err);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
