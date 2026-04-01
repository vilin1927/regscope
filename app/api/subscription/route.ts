import { NextResponse } from "next/server";
import { createSupabaseServerClient, requireAuth } from "@/lib/api-helpers";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { userId, error } = await requireAuth(supabase);
    if (!userId) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const { data } = await supabase
      .from("profiles")
      .select("subscription_status, subscription_period_end, trial_started_at")
      .eq("id", userId)
      .single();

    return NextResponse.json({
      subscription_status: data?.subscription_status || "free",
      subscription_period_end: data?.subscription_period_end || null,
      trial_started_at: data?.trial_started_at || null,
    });
  } catch (err) {
    console.error("Subscription GET error:", err);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
