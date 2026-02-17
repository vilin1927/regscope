import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;
    const { adminSupabase } = auth;

    const { data: subscribers, error: fetchError } = await adminSupabase!
      .from("newsletter_preferences")
      .select("user_id, opted_in, frequency, areas, locale, updated_at")
      .eq("opted_in", true)
      .order("updated_at", { ascending: false });

    if (fetchError) {
      console.error("Admin subscribers fetch error:", fetchError);
      return NextResponse.json(
        { error: "Abonnenten konnten nicht geladen werden" },
        { status: 500 }
      );
    }

    // Enrich with email from auth
    const enriched = await Promise.all(
      (subscribers || []).map(async (sub) => {
        const { data: userData } =
          await adminSupabase!.auth.admin.getUserById(sub.user_id);
        return {
          userId: sub.user_id,
          email: userData?.user?.email || "unknown",
          optedIn: sub.opted_in,
          frequency: sub.frequency,
          areas: sub.areas || [],
          locale: sub.locale || "de",
          updatedAt: sub.updated_at,
        };
      })
    );

    const optedInCount = enriched.filter((s) => s.optedIn).length;

    return NextResponse.json({
      subscribers: enriched,
      total: enriched.length,
      optedIn: optedInCount,
    });
  } catch (error) {
    console.error("Admin subscribers error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
