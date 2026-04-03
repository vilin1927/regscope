import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/db/auth-checks";

export async function POST() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    await db
      .update(profiles)
      .set({ contactConsentGiven: true })
      .where(eq(profiles.id, auth.userId));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // Non-blocking
  }
}
