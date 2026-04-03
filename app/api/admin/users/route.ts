import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/db/auth-checks";
import { db } from "@/lib/db";
import { users, scans, profiles, newsletterPreferences } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    // All users
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(users);

    // All scans (newest first)
    const allScans = await db
      .select({
        userId: scans.userId,
        createdAt: scans.createdAt,
        complianceScore: scans.complianceScore,
      })
      .from(scans)
      .orderBy(desc(scans.createdAt));

    // All newsletter preferences
    const allNewsletters = await db
      .select({
        userId: newsletterPreferences.userId,
        optedIn: newsletterPreferences.optedIn,
        frequency: newsletterPreferences.frequency,
      })
      .from(newsletterPreferences);

    // All profiles (trial info)
    const allProfiles = await db
      .select({
        id: profiles.id,
        trialStartedAt: profiles.trialStartedAt,
      })
      .from(profiles);

    // Build user list
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const userList = allUsers.map((user) => {
      const userScans = allScans.filter((s) => s.userId === user.id);
      const latestScan = userScans[0];
      const newsletter = allNewsletters.find((n) => n.userId === user.id);
      const profile = allProfiles.find((p) => p.id === user.id);

      return {
        id: user.id,
        email: user.email || "unknown",
        createdAt: user.createdAt?.toISOString() || null,
        totalScans: userScans.length,
        lastScanAt: latestScan?.createdAt?.toISOString() || null,
        latestComplianceScore: latestScan
          ? Math.round(Number(latestScan.complianceScore) || 0)
          : null,
        newsletterOptedIn: newsletter?.optedIn || false,
        newsletterFrequency: newsletter?.frequency || null,
        trialStartedAt: profile?.trialStartedAt?.toISOString() || null,
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
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
