import { NextResponse } from "next/server";
import { createSupabaseServerClient, requireAuth } from "@/lib/api-helpers";

// GET — consultant dashboard data (referrals, help requests, stats)
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { userId, error: authError } = await requireAuth(supabase);
    if (!userId) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    // Get consultant profile
    const { data: consultant, error: consultantError } = await supabase
      .from("consultants")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (consultantError || !consultant) {
      return NextResponse.json({ error: "Kein Beraterprofil gefunden" }, { status: 404 });
    }

    // Get referrals
    const { data: referrals } = await supabase
      .from("referrals")
      .select("*")
      .eq("consultant_id", consultant.id)
      .order("created_at", { ascending: false });

    // Get help requests
    const { data: helpRequests } = await supabase
      .from("help_requests")
      .select("*")
      .eq("consultant_id", consultant.id)
      .order("created_at", { ascending: false });

    // Calculate stats
    const totalReferrals = referrals?.length || 0;
    const activeReferrals = referrals?.filter((r) => r.status === "active").length || 0;
    const pendingRequests = helpRequests?.filter((r) => r.status === "pending").length || 0;
    const totalRequests = helpRequests?.length || 0;

    // Commission totals
    const commissionInitialTotal = referrals?.reduce((sum, r) => sum + (r.commission_initial || 0), 0) || 0;
    const commissionRecurringTotal = referrals?.reduce((sum, r) => sum + (r.commission_recurring || 0), 0) || 0;
    const commissionTotal = commissionInitialTotal + commissionRecurringTotal;

    return NextResponse.json({
      consultant,
      referrals: referrals || [],
      helpRequests: helpRequests || [],
      stats: {
        totalReferrals,
        activeReferrals,
        pendingRequests,
        totalRequests,
        commissionInitialTotal,
        commissionRecurringTotal,
        commissionTotal,
      },
    });
  } catch (err) {
    console.error("Consultant dashboard error:", err);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
