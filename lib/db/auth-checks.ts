import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { scans, consultants } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Pattern A: Verify the user is authenticated.
 * Returns userId or a 401 NextResponse error.
 */
export async function requireAuth(): Promise<
  { userId: string; email: string; error: null } | { userId: null; email: null; error: NextResponse }
> {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.email) {
    return {
      userId: null,
      email: null,
      error: NextResponse.json(
        { error: "Anmeldung erforderlich" },
        { status: 401 }
      ),
    };
  }
  return { userId: session.user.id, email: session.user.email, error: null };
}

/**
 * Pattern D: Verify the user is an admin.
 * Returns userId or a 401/403 NextResponse error.
 */
export async function requireAdmin(): Promise<
  { userId: string; email: string; error: null } | { userId: null; email: null; error: NextResponse }
> {
  const result = await requireAuth();
  if (result.error) return result;

  const adminEmails = (process.env.ADMIN_EMAIL || "")
    .split(",")
    .map((e) => e.trim().toLowerCase());

  if (!adminEmails.includes(result.email.toLowerCase())) {
    return {
      userId: null,
      email: null,
      error: NextResponse.json(
        { error: "Zugriff verweigert" },
        { status: 403 }
      ),
    };
  }

  return result;
}

/**
 * Pattern B: Verify the user owns a scan (for compliance_checks, etc.).
 * Returns true if the scan belongs to the user.
 */
export async function verifyScanOwnership(
  scanId: string,
  userId: string
): Promise<boolean> {
  const [scan] = await db
    .select({ id: scans.id })
    .from(scans)
    .where(and(eq(scans.id, scanId), eq(scans.userId, userId)))
    .limit(1);
  return !!scan;
}

/**
 * Pattern B: Verify the user owns a consultant profile.
 * Returns the consultant ID if valid.
 */
export async function verifyConsultantOwnership(
  userId: string
): Promise<string | null> {
  const [consultant] = await db
    .select({ id: consultants.id })
    .from(consultants)
    .where(eq(consultants.userId, userId))
    .limit(1);
  return consultant?.id ?? null;
}
