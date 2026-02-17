import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { render } from "@react-email/components";
import NewsletterDigest from "@/emails/newsletter-digest";

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
    // Admin-only: check ADMIN_EMAIL
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      return NextResponse.json(
        { error: "Admin email not configured" },
        { status: 500 }
      );
    }

    // Verify admin authorization via header
    const authHeader = request.headers.get("authorization");
    const adminKey = process.env.ADMIN_API_KEY;
    if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json(
        { error: "Resend API key not configured" },
        { status: 500 }
      );
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: "Service role key not configured" },
        { status: 500 }
      );
    }

    const resend = new Resend(resendApiKey);

    // Use service role to fetch all opted-in users
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );

    const { data: subscribers, error: fetchError } = await supabase
      .from("newsletter_preferences")
      .select("user_id, frequency, areas, locale")
      .eq("opted_in", true);

    if (fetchError) {
      console.error("Failed to fetch subscribers:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch subscribers" },
        { status: 500 }
      );
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ sent: 0, message: "No subscribers" });
    }

    const dashboardUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://smart-lex.de";
    const fromEmail = `ComplyRadar <newsletter@${process.env.RESEND_DOMAIN || "complyradar.de"}>`;

    // Process each subscriber
    const results = [];
    for (const sub of subscribers) {
      const { data: userData } = await supabase.auth.admin.getUserById(
        sub.user_id
      );

      if (!userData?.user?.email) continue;

      const email = userData.user.email;
      const locale: "de" | "en" = sub.locale === "en" ? "en" : "de";

      // Fetch latest scan for this user
      const { data: scan } = await supabase
        .from("scans")
        .select("matched_regulations, business_profile, compliance_score")
        .eq("user_id", sub.user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // Skip user if no scan exists — nothing to report
      if (!scan) {
        results.push({ email, status: "skipped", reason: "no_scan" });
        continue;
      }

      // Extract data from scan
      const allRegulations: Array<{
        name: string;
        category: string;
        riskLevel: string;
        summary: string;
      }> = scan.matched_regulations || [];

      // Filter to user's subscribed areas
      const userAreas: string[] = sub.areas || [];
      const filteredRegulations =
        userAreas.length > 0
          ? allRegulations.filter((r) => userAreas.includes(r.category))
          : allRegulations;

      // Sort by risk level (highest first)
      const sorted = [...filteredRegulations].sort(
        (a, b) => (riskOrder[a.riskLevel] ?? 2) - (riskOrder[b.riskLevel] ?? 2)
      );

      const updates = sorted.map((r) => ({
        title: r.name,
        category: (areaLabels[locale]?.[r.category] || r.category),
        riskLevel: r.riskLevel as "hoch" | "mittel" | "niedrig",
        summary: r.summary,
      }));

      // Compliance stats
      const complianceScore = Math.round(Number(scan.compliance_score) || 0);
      const totalRegulations = filteredRegulations.length;
      const highPriorityCount = filteredRegulations.filter(
        (r) => r.riskLevel === "hoch"
      ).length;

      // Company name from business_profile or email fallback
      const profile = scan.business_profile as Record<string, unknown> | null;
      const userName =
        (profile?.companyName as string) || email.split("@")[0];

      // Area labels in user's locale
      const subscribedAreas = userAreas.map(
        (a) => areaLabels[locale]?.[a] || a
      );

      // Subject line
      const subject =
        locale === "en"
          ? "Your Regulation Update — ComplyRadar"
          : "Ihr Vorschriften-Update — ComplyRadar";

      try {
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

        const { error: sendError } = await resend.emails.send({
          from: fromEmail,
          to: [email],
          subject,
          html,
        });

        if (sendError) {
          console.error(`Failed to send to ${email}:`, sendError);
          results.push({ email, status: "failed", error: sendError.message || String(sendError) });
        } else {
          results.push({ email, status: "sent" });
        }
      } catch (err) {
        console.error(`Error sending to ${email}:`, err);
        results.push({ email, status: "error" });
      }
    }

    const sent = results.filter((r) => r.status === "sent").length;
    return NextResponse.json({
      sent,
      total: results.length,
      results,
    });
  } catch (error) {
    console.error("Send newsletter error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
