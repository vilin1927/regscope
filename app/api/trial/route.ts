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
      .select({ trialStartedAt: profiles.trialStartedAt })
      .from(profiles)
      .where(eq(profiles.id, auth.userId))
      .limit(1);

    return NextResponse.json({
      trial_started_at: profile?.trialStartedAt ?? null,
    });
  } catch (error) {
    console.error("Trial GET error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const now = new Date();

    const result = await db
      .update(profiles)
      .set({ trialStartedAt: now })
      .where(eq(profiles.id, auth.userId))
      .returning({ trialStartedAt: profiles.trialStartedAt });

    if (result.length === 0) {
      console.error("Trial update: no profile found for userId", auth.userId);
      return NextResponse.json(
        { error: "Testphase konnte nicht gestartet werden" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      trial_started_at: result[0].trialStartedAt?.toISOString() ?? now.toISOString(),
    });
  } catch (error) {
    console.error("Trial error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
