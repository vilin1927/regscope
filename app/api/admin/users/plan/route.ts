import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/db/auth-checks";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { userId, action } = await req.json();

    if (!userId || !action) {
      return NextResponse.json(
        { error: "userId und action sind erforderlich" },
        { status: 400 }
      );
    }

    let trialStartedAt: Date | null = null;

    if (action === "start_trial") {
      // Start or restart 30-day trial (sets timestamp to now)
      trialStartedAt = new Date();
    } else if (action === "revoke_trial") {
      // Reset to free (clear trial timestamp)
      trialStartedAt = null;
    } else {
      return NextResponse.json(
        { error: "Ungültige Aktion. Erlaubt: start_trial, revoke_trial" },
        { status: 400 }
      );
    }

    await db
      .update(profiles)
      .set({ trialStartedAt })
      .where(eq(profiles.id, userId));

    return NextResponse.json({
      userId,
      trial_started_at: trialStartedAt?.toISOString() || null,
      action,
    });
  } catch (error) {
    console.error("Admin plan error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
