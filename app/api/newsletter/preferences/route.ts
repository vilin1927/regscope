import { NextResponse } from "next/server";
import {
  isRateLimited,
  createSupabaseServerClient,
  requireAuth,
} from "@/lib/api-helpers";

const VALID_FREQUENCIES = ["weekly", "monthly"];
const VALID_LOCALES = ["de", "en"];
const VALID_AREAS = [
  "arbeitssicherheit",
  "arbeitsrecht",
  "gewerberecht",
  "umweltrecht",
  "produktsicherheit",
  "datenschutz",
  "versicherungspflichten",
];

export async function GET(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const { userId, error: authError } = await requireAuth(supabase);
    if (!userId) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    const { data } = await supabase
      .from("newsletter_preferences")
      .select("opted_in, frequency, areas, locale")
      .eq("user_id", userId)
      .single();

    if (data) {
      return NextResponse.json({
        optedIn: data.opted_in,
        frequency: data.frequency,
        areas: data.areas,
        locale: data.locale ?? "de",
      });
    }

    // Return defaults
    return NextResponse.json({
      optedIn: false,
      frequency: "weekly",
      areas: [],
      locale: "de",
    });
  } catch (error) {
    console.error("Newsletter preferences GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const { userId, error: authError } = await requireAuth(supabase);
    if (!userId) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    let body: { optedIn?: boolean; frequency?: string; areas?: string[]; locale?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON" },
        { status: 400 }
      );
    }

    // Validate
    const optedIn =
      typeof body.optedIn === "boolean" ? body.optedIn : false;
    const frequency =
      typeof body.frequency === "string" &&
      VALID_FREQUENCIES.includes(body.frequency)
        ? body.frequency
        : "weekly";
    const areas = Array.isArray(body.areas)
      ? body.areas.filter((a) => VALID_AREAS.includes(a))
      : [];
    const locale =
      typeof body.locale === "string" && VALID_LOCALES.includes(body.locale)
        ? body.locale
        : "de";

    // Upsert
    const { error: upsertError } = await supabase
      .from("newsletter_preferences")
      .upsert(
        {
          user_id: userId,
          opted_in: optedIn,
          frequency,
          areas,
          locale,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("Newsletter preferences upsert error:", upsertError);
      return NextResponse.json(
        { error: "Failed to save preferences" },
        { status: 500 }
      );
    }

    return NextResponse.json({ optedIn, frequency, areas, locale });
  } catch (error) {
    console.error("Newsletter preferences PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
