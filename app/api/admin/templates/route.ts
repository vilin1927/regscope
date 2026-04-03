import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/db/auth-checks";
import { db } from "@/lib/db";
import { industryTemplates } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const templates = await db
      .select()
      .from(industryTemplates)
      .orderBy(desc(industryTemplates.usageCount));

    return NextResponse.json({ templates: templates || [] });
  } catch (err) {
    console.error("Admin templates error:", err);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
