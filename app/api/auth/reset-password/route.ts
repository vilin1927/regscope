import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/db/schema";
import { eq, and, isNull, gt } from "drizzle-orm";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token und Passwort erforderlich" },
        { status: 400 }
      );
    }

    if (!PASSWORD_REGEX.test(password)) {
      return NextResponse.json(
        {
          error:
            "Passwort muss mindestens 8 Zeichen, einen Großbuchstaben und eine Zahl enthalten",
        },
        { status: 400 }
      );
    }

    // Find valid, unused, non-expired token
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!resetToken) {
      return NextResponse.json(
        { error: "Ungültiger oder abgelaufener Link" },
        { status: 400 }
      );
    }

    // Hash new password and update user
    const passwordHash = await bcrypt.hash(password, 12);

    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(users.id, resetToken.userId));

      // Mark token as used (single-use)
      await tx
        .update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(eq(passwordResetTokens.id, resetToken.id));
    });

    return NextResponse.json({
      message: "Passwort erfolgreich zurückgesetzt",
    });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json(
      { error: "Fehler beim Zurücksetzen des Passworts" },
      { status: 500 }
    );
  }
}
