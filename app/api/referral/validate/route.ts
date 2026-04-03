import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { consultants } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET — validate a referral code and return consultant name
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code")?.trim().toUpperCase();

    if (!code) {
      return NextResponse.json({ valid: false, error: "Kein Code angegeben" });
    }

    const [consultant] = await db
      .select({
        id: consultants.id,
        name: consultants.name,
        tags: consultants.tags,
      })
      .from(consultants)
      .where(
        and(
          eq(consultants.referralCode, code),
          eq(consultants.isActive, true)
        )
      )
      .limit(1);

    if (!consultant) {
      return NextResponse.json({ valid: false, error: "Ungültiger Empfehlungscode" });
    }

    return NextResponse.json({
      valid: true,
      consultantName: consultant.name,
      consultantId: consultant.id,
    });
  } catch (err) {
    console.error("Referral validate error:", err);
    return NextResponse.json({ valid: false, error: "Validierung fehlgeschlagen" });
  }
}
