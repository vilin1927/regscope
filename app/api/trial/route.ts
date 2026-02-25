import { NextResponse } from "next/server";
import { createSupabaseServerClient, requireAuth } from "@/lib/api-helpers";

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const { userId, error } = await requireAuth(supabase);
    if (!userId) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ trial_started_at: now })
      .eq("id", userId);

    if (updateError) {
      console.error("Trial update error:", updateError);
      return NextResponse.json(
        { error: "Testphase konnte nicht gestartet werden" },
        { status: 500 }
      );
    }

    return NextResponse.json({ trial_started_at: now });
  } catch (error) {
    console.error("Trial error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
