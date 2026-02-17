import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;
    const { adminSupabase } = auth;

    // Fetch all users from auth
    const {
      data: { users },
      error: usersError,
    } = await adminSupabase!.auth.admin.listUsers();

    if (usersError) {
      console.error("Admin users fetch error:", usersError);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    // Fetch scan stats per user
    const { data: scans } = await adminSupabase!
      .from("scans")
      .select("user_id, created_at, compliance_score")
      .order("created_at", { ascending: false });

    // Fetch newsletter preferences
    const { data: newsletters } = await adminSupabase!
      .from("newsletter_preferences")
      .select("user_id, opted_in, frequency");

    // Build user list
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const userList = (users || []).map((user) => {
      const userScans = (scans || []).filter((s) => s.user_id === user.id);
      const latestScan = userScans[0];
      const newsletter = (newsletters || []).find(
        (n) => n.user_id === user.id
      );

      return {
        id: user.id,
        email: user.email || "unknown",
        createdAt: user.created_at,
        totalScans: userScans.length,
        lastScanAt: latestScan?.created_at || null,
        latestComplianceScore: latestScan
          ? Math.round(Number(latestScan.compliance_score) || 0)
          : null,
        newsletterOptedIn: newsletter?.opted_in || false,
        newsletterFrequency: newsletter?.frequency || null,
      };
    });

    const newUsersThisWeek = userList.filter(
      (u) => u.createdAt && new Date(u.createdAt) > weekAgo
    ).length;

    return NextResponse.json({
      users: userList,
      totalUsers: userList.length,
      newUsersThisWeek,
    });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
