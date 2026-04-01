import { NextResponse } from "next/server";
import { createSupabaseServerClient, requireAuth } from "@/lib/api-helpers";
import { EXPERTISE_TAGS } from "@/lib/consultant-types";
import { nanoid } from "nanoid";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { userId, error: authError } = await requireAuth(supabase);
    if (!userId) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone, bio, tags } = body;

    // Validation
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name ist erforderlich" }, { status: 400 });
    }
    if (!email?.trim()) {
      return NextResponse.json({ error: "E-Mail ist erforderlich" }, { status: 400 });
    }

    // Validate tags
    const validTags = (tags || []).filter((t: string) => EXPERTISE_TAGS.includes(t as typeof EXPERTISE_TAGS[number]));
    if (validTags.length === 0) {
      return NextResponse.json({ error: "Mindestens ein Fachgebiet ist erforderlich" }, { status: 400 });
    }

    // Check if user already registered as consultant
    const { data: existing } = await supabase
      .from("consultants")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Sie sind bereits als Berater registriert" }, { status: 409 });
    }

    // Generate unique referral code (8 chars, URL-safe)
    const referralCode = nanoid(8).toUpperCase();

    const { data, error } = await supabase
      .from("consultants")
      .insert({
        user_id: userId,
        name: name.trim(),
        email: email.trim(),
        phone: phone?.trim() || null,
        bio: bio?.trim() || null,
        tags: validTags,
        referral_code: referralCode,
      })
      .select()
      .single();

    if (error) {
      console.error("Consultant registration error:", error);
      return NextResponse.json({ error: "Registrierung fehlgeschlagen" }, { status: 500 });
    }

    return NextResponse.json({ consultant: data });
  } catch (err) {
    console.error("Consultant register error:", err);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
