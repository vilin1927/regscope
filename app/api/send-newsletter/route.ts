import { NextResponse } from "next/server";
import { Resend } from "resend";
import { render } from "@react-email/components";
import NewsletterDigest from "@/emails/newsletter-digest";
import { requireAdmin } from "@/lib/db/auth-checks";
import { db } from "@/lib/db";
import { users, scans, newsletterPreferences } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

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
    // Use session-based admin check instead of API key header
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json(
        { error: "Resend API-Schlüssel nicht konfiguriert" },
        { status: 500 }
      );
    }

    const resend = new Resend(resendApiKey);

    // Fetch all opted-in subscribers
    const subscribers = await db
      .select({
        userId: newsletterPreferences.userId,
        frequency: newsletterPreferences.frequency,
        areas: newsletterPreferences.areas,
        locale: newsletterPreferences.locale,
      })
      .from(newsletterPreferences)
      .where(eq(newsletterPreferences.optedIn, true));

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ sent: 0, message: "Keine Abonnenten" });
    }

    const dashboardUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://smart-lex.de";
    const fromEmail = `ComplyRadar <newsletter@${process.env.RESEND_DOMAIN || "complyradar.de"}>`;

    // Process each subscriber
    const results = [];
    for (const sub of subscribers) {
      // Get user email
      const [user] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, sub.userId))
        .limit(1);

      if (!user?.email) continue;

      const email = user.email;
      const locale: "de" | "en" = sub.locale === "en" ? "en" : "de";

      // Fetch latest scan for this user
      const [scan] = await db
        .select({
          matchedRegulations: scans.matchedRegulations,
          businessProfile: scans.businessProfile,
          complianceScore: scans.complianceScore,
        })
        .from(scans)
        .where(eq(scans.userId, sub.userId))
        .orderBy(desc(scans.createdAt))
        .limit(1);

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
      }> = (scan.matchedRegulations as Array<{
        name: string;
        category: string;
        riskLevel: string;
        summary: string;
      }>) || [];

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
        category: areaLabels[locale]?.[r.category] || r.category,
        riskLevel: r.riskLevel as "hoch" | "mittel" | "niedrig",
        summary: r.summary,
      }));

      // Compliance stats
      const complianceScore = Math.round(Number(scan.complianceScore) || 0);
      const totalRegulations = filteredRegulations.length;
      const highPriorityCount = filteredRegulations.filter(
        (r) => r.riskLevel === "hoch"
      ).length;

      // Company name from business_profile or email fallback
      const profile = scan.businessProfile as Record<string, unknown> | null;
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
            unsubscribeUrl: `${dashboardUrl}/newsletter/unsubscribe?uid=${sub.userId}`,
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
          results.push({
            email,
            status: "failed",
            error: sendError.message || String(sendError),
          });
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
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
