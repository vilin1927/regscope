import { NextResponse } from "next/server";
import { createSupabaseServerClient, requireAuth } from "@/lib/api-helpers";
import { EXPERTISE_TAGS } from "@/lib/consultant-types";

// GET — fetch own consultant profile
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { userId, error: authError } = await requireAuth(supabase);
    if (!userId) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("consultants")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
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
    const supabase = await createSupabaseServerClient();
    const { userId, error: authError } = await requireAuth(supabase);
    if (!userId) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.email !== undefined) updates.email = body.email.trim();
    if (body.phone !== undefined) updates.phone = body.phone?.trim() || null;
    if (body.bio !== undefined) updates.bio = body.bio?.trim() || null;
    if (body.tags !== undefined) {
      updates.tags = (body.tags || []).filter((t: string) =>
        EXPERTISE_TAGS.includes(t as typeof EXPERTISE_TAGS[number])
      );
    }
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("consultants")
      .update(updates)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Consultant profile update error:", error);
      return NextResponse.json({ error: "Aktualisierung fehlgeschlagen" }, { status: 500 });
    }

    return NextResponse.json({ consultant: data });
  } catch (err) {
    console.error("Consultant profile PATCH error:", err);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
