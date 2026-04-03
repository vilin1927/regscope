import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { complianceChecks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, verifyScanOwnership } from "@/lib/db/auth-checks";

export async function GET(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const scanId = searchParams.get("scanId");

    if (!scanId) {
      return NextResponse.json(
        { error: "Scan-ID erforderlich" },
        { status: 400 }
      );
    }

    const owns = await verifyScanOwnership(scanId, auth.userId);
    if (!owns) {
      return NextResponse.json(
        { error: "Zugriff verweigert" },
        { status: 403 }
      );
    }

    const data = await db
      .select()
      .from(complianceChecks)
      .where(eq(complianceChecks.scanId, scanId));

    return NextResponse.json({ checks: data });
  } catch (error) {
    console.error("Compliance checks GET error:", error);
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
      scanId?: string;
      regulationId?: string;
      checked?: boolean;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Ungültiges JSON im Anfragekörper" },
        { status: 400 }
      );
    }

    const { scanId, regulationId, checked } = body;

    if (!scanId || !regulationId) {
      return NextResponse.json(
        { error: "scanId und regulationId erforderlich" },
        { status: 400 }
      );
    }

    const owns = await verifyScanOwnership(scanId, auth.userId);
    if (!owns) {
      return NextResponse.json(
        { error: "Zugriff verweigert" },
        { status: 403 }
      );
    }

    if (checked) {
      await db
        .insert(complianceChecks)
        .values({
          scanId,
          regulationId,
          checked: true,
        })
        .onConflictDoUpdate({
          target: [complianceChecks.scanId, complianceChecks.regulationId],
          set: {
            checked: true,
            checkedAt: new Date(),
          },
        });
    } else {
      await db
        .delete(complianceChecks)
        .where(
          and(
            eq(complianceChecks.scanId, scanId),
            eq(complianceChecks.regulationId, regulationId)
          )
        );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Compliance checks POST error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
