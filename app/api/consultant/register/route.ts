import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/db/auth-checks";
import { db } from "@/lib/db";
import { consultants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { EXPERTISE_TAGS } from "@/lib/consultant-types";
import { nanoid } from "nanoid";

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { userId } = auth;

    const body = await request.json();
    const { name, email, phone, bio, tags } = body;

    // Validation
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name ist erforderlich" }, { status: 400 });
    }
    if (!email?.trim()) {
      return NextResponse.json({ error: "E-Mail ist erforderlich" }, { status: 400 });
    }

    // Validate tags
    const validTags = (tags || []).filter((t: string) =>
      EXPERTISE_TAGS.includes(t as (typeof EXPERTISE_TAGS)[number])
    );
    if (validTags.length === 0) {
      return NextResponse.json(
        { error: "Mindestens ein Fachgebiet ist erforderlich" },
        { status: 400 }
      );
    }

    // Check if user already registered as consultant
    const [existing] = await db
      .select({ id: consultants.id })
      .from(consultants)
      .where(eq(consultants.userId, userId))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "Sie sind bereits als Berater registriert" },
        { status: 409 }
      );
    }

    // Generate unique referral code (8 chars, URL-safe)
    const referralCode = nanoid(8).toUpperCase();

    const [data] = await db
      .insert(consultants)
      .values({
        userId,
        name: name.trim(),
        email: email.trim(),
        phone: phone?.trim() || null,
        bio: bio?.trim() || null,
        tags: validTags,
        referralCode,
      })
      .returning();

    return NextResponse.json({ consultant: data });
  } catch (err) {
    console.error("Consultant register error:", err);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
