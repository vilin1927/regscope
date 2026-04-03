import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json(
        { error: "E-Mail erforderlich" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Always return success to prevent email enumeration
    const successResponse = NextResponse.json({
      message:
        "Falls ein Konto mit dieser E-Mail existiert, wurde ein Link zum Zurücksetzen gesendet.",
    });

    // Look up user
    const [user] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (!user) return successResponse;

    // Generate secure token (64 bytes hex = 128 chars)
    const token = crypto.randomBytes(64).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt,
    });

    // Send reset email
    const baseUrl =
      process.env.NEXTAUTH_URL || process.env.AUTH_URL || "https://smart-lex.de";
    const resetUrl = `${baseUrl}/de/auth/reset-password?token=${token}`;

    await resend.emails.send({
      from: "ComplyRadar <noreply@smart-lex.de>",
      to: user.email,
      subject: "Passwort zurücksetzen — ComplyRadar",
      html: `
        <h2>Passwort zurücksetzen</h2>
        <p>Klicken Sie auf den folgenden Link, um Ihr Passwort zurückzusetzen:</p>
        <p><a href="${resetUrl}" style="background:#2563eb;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Passwort zurücksetzen</a></p>
        <p>Dieser Link ist 1 Stunde gültig.</p>
        <p>Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail.</p>
        <hr>
        <p style="color:#6b7280;font-size:12px;">ComplyRadar — smart-lex.de</p>
      `,
    });

    return successResponse;
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json(
      { error: "Fehler beim Senden der E-Mail" },
      { status: 500 }
    );
  }
}
