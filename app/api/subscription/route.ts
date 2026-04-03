import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/db/auth-checks";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const [profile] = await db
      .select({
        subscriptionStatus: profiles.subscriptionStatus,
        subscriptionPeriodEnd: profiles.subscriptionPeriodEnd,
        trialStartedAt: profiles.trialStartedAt,
      })
      .from(profiles)
      .where(eq(profiles.id, auth.userId))
      .limit(1);

    if (!profile) {
      return NextResponse.json({
        subscription_status: "free",
        subscription_period_end: null,
        trial_started_at: null,
      });
    }

    return NextResponse.json({
      subscription_status: profile.subscriptionStatus,
      subscription_period_end: profile.subscriptionPeriodEnd,
      trial_started_at: profile.trialStartedAt,
    });
  } catch (error) {
    console.error("Subscription GET error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
