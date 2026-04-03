import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users, profiles, referrals } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, referralCode } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-Mail und Passwort erforderlich" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!PASSWORD_REGEX.test(password)) {
      return NextResponse.json(
        {
          error:
            "Passwort muss mindestens 8 Zeichen, einen Großbuchstaben und eine Zahl enthalten",
        },
        { status: 400 }
      );
    }

    // Check if user already exists
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

    // Hash password (bcrypt cost 12, same as Supabase)
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user + profile in a transaction
    const [newUser] = await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          email: normalizedEmail,
          passwordHash,
        })
        .returning();

      // Auto-create profile (replaces Supabase handle_new_user trigger)
      await tx.insert(profiles).values({
        id: user.id,
        language: "de",
      });

      // Record referral if code provided
      if (referralCode && typeof referralCode === "string") {
        try {
          const res = await fetch(
            `${process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3000"}/api/referral/validate?code=${encodeURIComponent(referralCode)}`
          );
          const data = await res.json();
          if (data.valid && data.consultantId) {
            await tx.insert(referrals).values({
              referralCode,
              consultantId: data.consultantId,
              customerUserId: user.id,
            });
          }
        } catch {
          // Referral failure is non-blocking
        }
      }

      return [user];
    });

    return NextResponse.json({
      user: { id: newUser.id, email: newUser.email },
    });
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: "Registrierung fehlgeschlagen" },
      { status: 500 }
    );
  }
}
