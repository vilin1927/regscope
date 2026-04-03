import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/db/auth-checks";
import { db } from "@/lib/db";
import { consultants, referrals, helpRequests } from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";

// POST — customer clicks "Get Professional Help" for a category
export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { userId } = auth;

    const body = await request.json();
    const { category, message, contactEmail, contactPhone } = body;

    if (!category?.trim()) {
      return NextResponse.json({ error: "Kategorie ist erforderlich" }, { status: 400 });
    }

    // Find the consultant to assign:
    // 1. If customer has a referral -> always that consultant
    // 2. Otherwise -> random active consultant with matching tag
    let consultantId: string | null = null;

    // Check if customer has a referral
    const [referral] = await db
      .select({ consultantId: referrals.consultantId })
      .from(referrals)
      .where(eq(referrals.customerUserId, userId))
      .limit(1);

    if (referral) {
      consultantId = referral.consultantId;
    } else {
      // Find random active consultant with matching tag
      // Postgres array contains: tags @> ARRAY['category']
      const matchingConsultants = await db
        .select({ id: consultants.id })
        .from(consultants)
        .where(
          and(
            eq(consultants.isActive, true),
            sql`${consultants.tags} @> ARRAY[${category.trim()}]::text[]`
          )
        );

      if (matchingConsultants.length > 0) {
        const randomIndex = Math.floor(Math.random() * matchingConsultants.length);
        consultantId = matchingConsultants[randomIndex].id;
      }
    }

    const [data] = await db
      .insert(helpRequests)
      .values({
        customerUserId: userId,
        consultantId,
        category: category.trim(),
        message: message?.trim() || null,
        customerEmail: contactEmail?.trim() || null,
        customerPhone: contactPhone?.trim() || null,
        contactRevealed: !!(contactEmail || contactPhone),
      })
      .returning();

    return NextResponse.json({
      helpRequest: data,
      matched: !!consultantId,
    });
  } catch (err) {
    console.error("Help request error:", err);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}

// GET — customer views their own help requests
export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { userId } = auth;

    const data = await db
      .select()
      .from(helpRequests)
      .where(eq(helpRequests.customerUserId, userId))
      .orderBy(desc(helpRequests.createdAt));

    return NextResponse.json({ helpRequests: data });
  } catch (err) {
    console.error("Help requests GET error:", err);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
