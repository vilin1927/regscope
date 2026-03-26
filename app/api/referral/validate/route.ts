import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/api-helpers";

// GET — validate a referral code and return consultant name
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code")?.trim().toUpperCase();

    if (!code) {
      return NextResponse.json({ valid: false, error: "Kein Code angegeben" });
    }

    const supabase = await createSupabaseServerClient();

    const { data: consultant } = await supabase
      .from("consultants")
      .select("id, name, tags")
      .eq("referral_code", code)
      .eq("is_active", true)
      .single();

    if (!consultant) {
      return NextResponse.json({ valid: false, error: "Ungültiger Empfehlungscode" });
    }

    return NextResponse.json({
      valid: true,
      consultantName: consultant.name,
      consultantId: consultant.id,
    });
  } catch (err) {
    console.error("Referral validate error:", err);
    return NextResponse.json({ valid: false, error: "Validierung fehlgeschlagen" });
  }
}
