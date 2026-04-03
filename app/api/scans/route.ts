import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scans } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/db/auth-checks";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const data = await db
      .select()
      .from(scans)
      .where(eq(scans.userId, auth.userId))
      .orderBy(desc(scans.createdAt))
      .limit(50);

    return NextResponse.json({ scans: data });
  } catch (error) {
    console.error("Scans GET error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    let body: {
      businessProfile?: unknown;
      matchedRegulations?: unknown;
      complianceScore?: number;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Ungültiges JSON im Anfragekörper" },
        { status: 400 }
      );
    }

    const { businessProfile, matchedRegulations, complianceScore } = body;

    if (!businessProfile || typeof businessProfile !== "object") {
      return NextResponse.json(
        { error: "Unternehmensprofil fehlt" },
        { status: 400 }
      );
    }

    const [inserted] = await db
      .insert(scans)
      .values({
        userId: auth.userId,
        businessProfile,
        matchedRegulations: matchedRegulations ?? [],
        complianceScore: String(complianceScore ?? 0),
      })
      .returning();

    return NextResponse.json({ scan: inserted });
  } catch (error) {
    console.error("Scans POST error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
