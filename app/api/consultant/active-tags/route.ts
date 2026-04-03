import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { consultants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET — returns list of expertise tags that have at least one active consultant
export async function GET() {
  try {
    const rows = await db
      .select({ tags: consultants.tags })
      .from(consultants)
      .where(eq(consultants.isActive, true));

    const tagSet = new Set<string>();
    rows.forEach((c) => {
      (c.tags || []).forEach((tag: string) => tagSet.add(tag));
    });

    return NextResponse.json({ tags: Array.from(tagSet) });
  } catch (err) {
    console.error("Active tags error:", err);
    return NextResponse.json({ tags: [] });
  }
}
