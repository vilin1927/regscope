import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;
    const { adminSupabase } = auth;

    const { data: templates, error } = await adminSupabase!
      .from("industry_templates")
      .select("*")
      .order("usage_count", { ascending: false });

    if (error) {
      console.error("Admin templates fetch error:", error);
      return NextResponse.json(
        { error: "Vorlagen konnten nicht geladen werden" },
        { status: 500 }
      );
    }

    return NextResponse.json({ templates: templates || [] });
  } catch (err) {
    console.error("Admin templates error:", err);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
