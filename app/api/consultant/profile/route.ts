import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/db/auth-checks";
import { db } from "@/lib/db";
import { consultants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { EXPERTISE_TAGS } from "@/lib/consultant-types";

// GET — fetch own consultant profile
export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { userId } = auth;

    const [data] = await db
      .select()
      .from(consultants)
      .where(eq(consultants.userId, userId))
      .limit(1);

    if (!data) {
      return NextResponse.json({ consultant: null });
    }

    return NextResponse.json({ consultant: data });
  } catch (err) {
    console.error("Consultant profile GET error:", err);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}

// PATCH — update own consultant profile
export async function PATCH(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { userId } = auth;

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.email !== undefined) updates.email = body.email.trim();
    if (body.phone !== undefined) updates.phone = body.phone?.trim() || null;
    if (body.bio !== undefined) updates.bio = body.bio?.trim() || null;
    if (body.tags !== undefined) {
      updates.tags = (body.tags || []).filter((t: string) =>
        EXPERTISE_TAGS.includes(t as (typeof EXPERTISE_TAGS)[number])
      );
    }
    updates.updatedAt = new Date();

    const [data] = await db
      .update(consultants)
      .set(updates)
      .where(eq(consultants.userId, userId))
      .returning();

    if (!data) {
      return NextResponse.json({ error: "Aktualisierung fehlgeschlagen" }, { status: 500 });
    }

    return NextResponse.json({ consultant: data });
  } catch (err) {
    console.error("Consultant profile PATCH error:", err);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
