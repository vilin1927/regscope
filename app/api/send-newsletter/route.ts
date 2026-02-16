import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    // Use service role to fetch all opted-in users
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );

    const { data: subscribers, error: fetchError } = await supabase
      .from("newsletter_preferences")
      .select("user_id, frequency, areas")
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

    // Fetch user emails via auth admin API
    const results = [];
    for (const sub of subscribers) {
      const { data: userData } = await supabase.auth.admin.getUserById(
        sub.user_id
      );

      if (!userData?.user?.email) continue;

      const email = userData.user.email;
      const dashboardUrl =
        process.env.NEXT_PUBLIC_APP_URL || "https://regscope-nine.vercel.app";

      // Send via Resend
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: `ComplyRadar <newsletter@${process.env.RESEND_DOMAIN || "complyradar.de"}>`,
            to: [email],
            subject:
              sub.frequency === "weekly"
                ? "Ihr wöchentliches Vorschriften-Update — ComplyRadar"
                : "Ihr monatliches Vorschriften-Update — ComplyRadar",
            html: buildHtmlEmail(
              email.split("@")[0],
              sub.frequency,
              sub.areas,
              dashboardUrl
            ),
          }),
        });

        if (res.ok) {
          results.push({ email, status: "sent" });
        } else {
          const err = await res.text();
          console.error(`Failed to send to ${email}:`, err);
          results.push({ email, status: "failed" });
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

function buildHtmlEmail(
  userName: string,
  frequency: string,
  areas: string[],
  dashboardUrl: string
): string {
  const greeting =
    frequency === "weekly"
      ? "Ihr wöchentliches Vorschriften-Update"
      : "Ihr monatliches Vorschriften-Update";

  const areaLabels: Record<string, string> = {
    arbeitssicherheit: "Arbeitssicherheit",
    arbeitsrecht: "Arbeitsrecht",
    gewerberecht: "Gewerberecht",
    umweltrecht: "Umweltrecht",
    produktsicherheit: "Produktsicherheit",
    datenschutz: "Datenschutz",
    versicherungspflichten: "Versicherungspflichten",
  };

  const selectedAreas =
    areas.length > 0
      ? areas.map((a) => areaLabels[a] || a).join(", ")
      : "Alle Bereiche";

  return `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"></head>
<body style="background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:20px">
  <div style="max-width:600px;margin:0 auto">
    <div style="background:#2563eb;padding:20px 24px;border-radius:12px 12px 0 0">
      <span style="color:#fff;font-size:18px;font-weight:700">ComplyRadar</span>
    </div>
    <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none">
      <p style="font-size:16px;color:#1e293b;margin:0 0 4px">Hallo ${userName},</p>
      <p style="font-size:20px;font-weight:700;color:#1e293b;margin:0 0 20px">${greeting}</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:12px">
        <p style="font-size:14px;font-weight:600;color:#1e293b;margin:0 0 8px">Ihre abonnierten Bereiche</p>
        <p style="font-size:13px;color:#475569;margin:0">${selectedAreas}</p>
      </div>
      <p style="font-size:14px;color:#64748b;text-align:center;padding:16px 0">
        Besuchen Sie Ihr ComplyRadar Dashboard für aktuelle Compliance-Informationen.
      </p>
      <div style="text-align:center;margin:24px 0">
        <a href="${dashboardUrl}" style="display:inline-block;background:#2563eb;color:#fff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none">Zum Dashboard</a>
      </div>
      <hr style="border-color:#e2e8f0;margin:20px 0">
      <p style="font-size:12px;color:#94a3b8;text-align:center;margin:4px 0">
        Sie erhalten diese E-Mail, weil Sie den ComplyRadar Vorschriften-Newsletter abonniert haben.
      </p>
    </div>
  </div>
</body>
</html>`;
}
