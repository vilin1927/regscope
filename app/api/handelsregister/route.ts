import { NextRequest, NextResponse } from "next/server";
import { isRateLimited } from "@/lib/api-helpers";
import { searchHandelsregister } from "@/lib/handelsregister-client";

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte warten Sie eine Minute." },
      { status: 429 }
    );
  }

  const searchTerm = request.nextUrl.searchParams.get("search")?.trim();
  if (!searchTerm || searchTerm.length < 2) {
    return NextResponse.json(
      { error: "Suchbegriff muss mindestens 2 Zeichen lang sein." },
      { status: 400 }
    );
  }

  const option = (request.nextUrl.searchParams.get("option") || "all") as "all" | "min" | "exact";

  try {
    const result = await searchHandelsregister(searchTerm, option);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Handelsregister proxy error:", err);
    const message = err instanceof Error ? err.message : "Handelsregister-Suche fehlgeschlagen";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
