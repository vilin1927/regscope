import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * Proxy for /api/send-newsletter that uses session-based admin auth
 * instead of API key from client. Calls the existing send endpoint internally.
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    // Call the existing send-newsletter endpoint with the server-side API key
    const adminApiKey = process.env.ADMIN_API_KEY;
    if (!adminApiKey) {
      return NextResponse.json(
        { error: "Admin API key not configured" },
        { status: 500 }
      );
    }

    const origin = request.headers.get("origin") || request.headers.get("host") || "";
    const protocol = origin.startsWith("localhost") ? "http" : "https";
    const baseUrl = origin.startsWith("http") ? origin : `${protocol}://${origin}`;

    const res = await fetch(`${baseUrl}/api/send-newsletter`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminApiKey}`,
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Admin send newsletter proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
