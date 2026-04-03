import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsletterPreferences } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/db/auth-checks";

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

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const [data] = await db
      .select({
        optedIn: newsletterPreferences.optedIn,
        frequency: newsletterPreferences.frequency,
        areas: newsletterPreferences.areas,
        locale: newsletterPreferences.locale,
      })
      .from(newsletterPreferences)
      .where(eq(newsletterPreferences.userId, auth.userId))
      .limit(1);

    if (data) {
      return NextResponse.json({
        optedIn: data.optedIn,
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
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    let body: {
      optedIn?: boolean;
      frequency?: string;
      areas?: string[];
      locale?: string;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Ungültiges JSON" },
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
    await db
      .insert(newsletterPreferences)
      .values({
        userId: auth.userId,
        optedIn,
        frequency,
        areas,
        locale,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: newsletterPreferences.userId,
        set: {
          optedIn,
          frequency,
          areas,
          locale,
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({ optedIn, frequency, areas, locale });
  } catch (error) {
    console.error("Newsletter preferences PUT error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
