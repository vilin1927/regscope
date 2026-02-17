import { NextResponse } from "next/server";
import { render } from "@react-email/components";
import NewsletterDigest from "@/emails/newsletter-digest";
import { requireAdmin } from "@/lib/admin-auth";

const areaLabels: Record<string, Record<string, string>> = {
  de: {
    arbeitssicherheit: "Arbeitssicherheit",
    arbeitsrecht: "Arbeitsrecht",
    gewerberecht: "Gewerberecht",
    umweltrecht: "Umweltrecht",
    produktsicherheit: "Produktsicherheit",
    datenschutz: "Datenschutz",
    versicherungspflichten: "Versicherungspflichten",
  },
  en: {
    arbeitssicherheit: "Workplace Safety",
    arbeitsrecht: "Employment Law",
    gewerberecht: "Trade Law",
    umweltrecht: "Environmental Law",
    produktsicherheit: "Product Safety",
    datenschutz: "Data Protection",
    versicherungspflichten: "Insurance Obligations",
  },
};

const riskOrder: Record<string, number> = { hoch: 0, mittel: 1, niedrig: 2 };

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;
    const { adminSupabase } = auth;

    let body: { subscriberId?: string } = {};
    try {
      body = await request.json();
    } catch {
      // empty body is fine — use first subscriber
    }

    // Find subscriber
    let subscriberQuery = adminSupabase!
      .from("newsletter_preferences")
      .select("user_id, frequency, areas, locale")
      .eq("opted_in", true)
      .limit(1);

    if (body.subscriberId) {
      subscriberQuery = adminSupabase!
        .from("newsletter_preferences")
        .select("user_id, frequency, areas, locale")
        .eq("user_id", body.subscriberId)
        .limit(1);
    }

    const { data: subscribers } = await subscriberQuery;
    const sub = subscribers?.[0];

    if (!sub) {
      return NextResponse.json(
        { error: "Kein Abonnent gefunden" },
        { status: 404 }
      );
    }

    // Get user email
    const { data: userData } =
      await adminSupabase!.auth.admin.getUserById(sub.user_id);
    const email = userData?.user?.email || "user@example.com";
    const locale: "de" | "en" = sub.locale === "en" ? "en" : "de";

    // Fetch latest scan
    const { data: scan } = await adminSupabase!
      .from("scans")
      .select("matched_regulations, business_profile, compliance_score")
      .eq("user_id", sub.user_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const allRegulations: Array<{
      name: string;
      category: string;
      riskLevel: string;
      summary: string;
    }> = scan?.matched_regulations || [];

    const userAreas: string[] = sub.areas || [];
    const filteredRegulations =
      userAreas.length > 0
        ? allRegulations.filter((r) => userAreas.includes(r.category))
        : allRegulations;

    const sorted = [...filteredRegulations].sort(
      (a, b) =>
        (riskOrder[a.riskLevel] ?? 2) - (riskOrder[b.riskLevel] ?? 2)
    );

    const updates = sorted.map((r) => ({
      title: r.name,
      category: areaLabels[locale]?.[r.category] || r.category,
      riskLevel: r.riskLevel as "hoch" | "mittel" | "niedrig",
      summary: r.summary,
    }));

    const complianceScore = Math.round(Number(scan?.compliance_score) || 0);
    const totalRegulations = filteredRegulations.length;
    const highPriorityCount = filteredRegulations.filter(
      (r) => r.riskLevel === "hoch"
    ).length;

    const profile = scan?.business_profile as Record<string, unknown> | null;
    const userName =
      (profile?.companyName as string) || email.split("@")[0];

    const subscribedAreas = userAreas.map(
      (a) => areaLabels[locale]?.[a] || a
    );

    const dashboardUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://smart-lex.de";

    const subject =
      locale === "en"
        ? "Your Regulation Update — ComplyRadar"
        : "Ihr Vorschriften-Update — ComplyRadar";

    const html = await render(
      NewsletterDigest({
        userName,
        locale,
        subscribedAreas,
        complianceScore,
        totalRegulations,
        highPriorityCount,
        updates,
        dashboardUrl,
        unsubscribeUrl: `${dashboardUrl}/newsletter/unsubscribe?uid=${sub.user_id}`,
      })
    );

    return NextResponse.json({ html, subject, to: email, locale });
  } catch (error) {
    console.error("Admin preview newsletter error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
