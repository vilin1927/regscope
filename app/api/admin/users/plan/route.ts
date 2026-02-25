import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;
    const { adminSupabase } = auth;

    const { userId, action } = await req.json();

    if (!userId || !action) {
      return NextResponse.json(
        { error: "userId und action sind erforderlich" },
        { status: 400 }
      );
    }

    let trial_started_at: string | null = null;

    if (action === "start_trial") {
      // Start or restart 30-day trial (sets timestamp to now)
      trial_started_at = new Date().toISOString();
    } else if (action === "revoke_trial") {
      // Reset to free (clear trial timestamp)
      trial_started_at = null;
    } else {
      return NextResponse.json(
        { error: "Ungültige Aktion. Erlaubt: start_trial, revoke_trial" },
        { status: 400 }
      );
    }

    const { error: updateError } = await adminSupabase!
      .from("profiles")
      .update({ trial_started_at })
      .eq("id", userId);

    if (updateError) {
      console.error("Admin plan update error:", updateError);
      return NextResponse.json(
        { error: "Plan konnte nicht aktualisiert werden" },
        { status: 500 }
      );
    }

    return NextResponse.json({ userId, trial_started_at, action });
  } catch (error) {
    console.error("Admin plan error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
