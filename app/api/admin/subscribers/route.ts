import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/db/auth-checks";
import { db } from "@/lib/db";
import { users, newsletterPreferences } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    // Fetch opted-in subscribers joined with users for email
    const subscribers = await db
      .select({
        userId: newsletterPreferences.userId,
        optedIn: newsletterPreferences.optedIn,
        frequency: newsletterPreferences.frequency,
        areas: newsletterPreferences.areas,
        locale: newsletterPreferences.locale,
        updatedAt: newsletterPreferences.updatedAt,
        email: users.email,
      })
      .from(newsletterPreferences)
      .innerJoin(users, eq(newsletterPreferences.userId, users.id))
      .where(eq(newsletterPreferences.optedIn, true))
      .orderBy(desc(newsletterPreferences.updatedAt));

    const enriched = subscribers.map((sub) => ({
      userId: sub.userId,
      email: sub.email || "unknown",
      optedIn: sub.optedIn,
      frequency: sub.frequency,
      areas: sub.areas || [],
      locale: sub.locale || "de",
      updatedAt: sub.updatedAt?.toISOString() || null,
    }));

    const optedInCount = enriched.filter((s) => s.optedIn).length;

    return NextResponse.json({
      subscribers: enriched,
      total: enriched.length,
      optedIn: optedInCount,
    });
  } catch (error) {
    console.error("Admin subscribers error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
