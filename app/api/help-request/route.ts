import { NextResponse } from "next/server";
import { createSupabaseServerClient, requireAuth } from "@/lib/api-helpers";

// POST — customer clicks "Get Professional Help" for a category
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { userId, error: authError } = await requireAuth(supabase);
    if (!userId) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    const body = await request.json();
    const { category, message, contactEmail, contactPhone } = body;

    if (!category?.trim()) {
      return NextResponse.json({ error: "Kategorie ist erforderlich" }, { status: 400 });
    }

    // Find the consultant to assign:
    // 1. If customer has a referral → always that consultant
    // 2. Otherwise → random active consultant with matching tag
    let consultantId: string | null = null;

    // Check if customer has a referral
    const { data: referral } = await supabase
      .from("referrals")
      .select("consultant_id")
      .eq("customer_user_id", userId)
      .single();

    if (referral) {
      consultantId = referral.consultant_id;
    } else {
      // Find random active consultant with matching tag
      const { data: matchingConsultants } = await supabase
        .from("consultants")
        .select("id")
        .eq("is_active", true)
        .contains("tags", [category.trim()]);

      if (matchingConsultants && matchingConsultants.length > 0) {
        const randomIndex = Math.floor(Math.random() * matchingConsultants.length);
        consultantId = matchingConsultants[randomIndex].id;
      }
    }

    const { data, error } = await supabase
      .from("help_requests")
      .insert({
        customer_user_id: userId,
        consultant_id: consultantId,
        category: category.trim(),
        message: message?.trim() || null,
        customer_email: contactEmail?.trim() || null,
        customer_phone: contactPhone?.trim() || null,
        contact_revealed: !!(contactEmail || contactPhone),
      })
      .select()
      .single();

    if (error) {
      console.error("Help request insert error:", error);
      return NextResponse.json({ error: "Anfrage konnte nicht erstellt werden" }, { status: 500 });
    }

    return NextResponse.json({
      helpRequest: data,
      matched: !!consultantId,
    });
  } catch (err) {
    console.error("Help request error:", err);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}

// GET — customer views their own help requests
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { userId, error: authError } = await requireAuth(supabase);
    if (!userId) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("help_requests")
      .select("*")
      .eq("customer_user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Help requests fetch error:", error);
      return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 });
    }

    return NextResponse.json({ helpRequests: data || [] });
  } catch (err) {
    console.error("Help requests GET error:", err);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
