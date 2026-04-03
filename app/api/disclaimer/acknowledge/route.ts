import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { disclaimerAcknowledgments } from "@/lib/db/schema";
import { requireAuth } from "@/lib/db/auth-checks";

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const body = await request.json();
    const { scanId } = body;

    if (!scanId) {
      return NextResponse.json(
        { error: "Scan-ID erforderlich" },
        { status: 400 }
      );
    }

    await db.insert(disclaimerAcknowledgments).values({
      userId: auth.userId,
      scanId,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // Non-blocking, don't fail the UX
  }
}
