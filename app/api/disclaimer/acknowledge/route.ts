import { NextResponse } from "next/server";
import { createSupabaseServerClient, requireAuth } from "@/lib/api-helpers";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { userId, error: authError } = await requireAuth(supabase);
    if (!userId) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    const body = await request.json();
    const { scanId } = body;

    if (!scanId) {
      return NextResponse.json({ error: "Scan-ID erforderlich" }, { status: 400 });
    }

    await supabase.from("disclaimer_acknowledgments").insert({
      user_id: userId,
      scan_id: scanId,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // Non-blocking, don't fail the UX
  }
}
