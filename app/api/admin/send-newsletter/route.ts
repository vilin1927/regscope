import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/db/auth-checks";

/**
 * Proxy for /api/send-newsletter that uses session-based admin auth.
 * Since the main send-newsletter endpoint now also uses requireAdmin(),
 * this proxy simply forwards the request.
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const origin =
      request.headers.get("origin") ||
      request.headers.get("host") ||
      "";
    const protocol = origin.startsWith("localhost") ? "http" : "https";
    const baseUrl = origin.startsWith("http")
      ? origin
      : `${protocol}://${origin}`;

    // Forward with the same cookies so /api/send-newsletter can authenticate
    const res = await fetch(`${baseUrl}/api/send-newsletter`, {
      method: "POST",
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Admin send newsletter proxy error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
