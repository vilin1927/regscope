import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users, profiles, consultants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { EXPERTISE_TAGS } from "@/lib/consultant-types";
import { nanoid } from "nanoid";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

/**
 * POST /api/consultant/signup
 * Creates a user account + profile + consultant record in one transaction.
 * Allows consultants to register directly without doing a compliance scan first.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, phone, bio, tags } = body;

    // --- Validate account fields ---
    if (!email?.trim() || !password) {
      return NextResponse.json(
        { error: "E-Mail und Passwort erforderlich" },
        { status: 400 }
      );
    }

    const normalizedEmail = (email as string).toLowerCase().trim();

    if (!PASSWORD_REGEX.test(password)) {
      return NextResponse.json(
        {
          error:
            "Passwort muss mindestens 8 Zeichen, einen Großbuchstaben und eine Zahl enthalten",
        },
        { status: 400 }
      );
    }

    // --- Validate consultant fields ---
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Name ist erforderlich" },
        { status: 400 }
      );
    }

    const validTags = (tags || []).filter((t: string) =>
      EXPERTISE_TAGS.includes(t as (typeof EXPERTISE_TAGS)[number])
    );
    if (validTags.length === 0) {
      return NextResponse.json(
        { error: "Mindestens ein Fachgebiet ist erforderlich" },
        { status: 400 }
      );
    }

    // --- Check if user already exists ---
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "Ein Konto mit dieser E-Mail existiert bereits" },
        { status: 409 }
      );
    }

    // --- Hash password ---
    const passwordHash = await bcrypt.hash(password, 12);

    // --- Generate referral code ---
    const referralCode = nanoid(8).toUpperCase();

    // --- Create user + profile + consultant in one transaction ---
    const result = await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          email: normalizedEmail,
          passwordHash,
        })
        .returning();

      await tx.insert(profiles).values({
        id: user.id,
        language: "de",
      });

      const [consultant] = await tx
        .insert(consultants)
        .values({
          userId: user.id,
          name: name.trim(),
          email: normalizedEmail,
          phone: phone?.trim() || null,
          bio: bio?.trim() || null,
          tags: validTags,
          referralCode,
        })
        .returning();

      return { user, consultant };
    });

    return NextResponse.json({
      user: { id: result.user.id, email: result.user.email },
      consultant: result.consultant,
    });
  } catch (err) {
    console.error("Consultant signup error:", err);
    return NextResponse.json(
      { error: "Registrierung fehlgeschlagen" },
      { status: 500 }
    );
  }
}
