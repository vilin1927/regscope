import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, requireAuth } from "@/lib/api-helpers";
import { stripe, STRIPE_PRICES } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { userId, error } = await requireAuth(supabase);
    if (!userId) {
      return NextResponse.json({ error }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .single();

    // Get user email
    const { data: { user } } = await supabase.auth.getUser();
    const email = user?.email;

    // Check for referral code and locale in request body
    const body = await req.json().catch(() => ({}));
    const referralCode = body.referral_code || null;
    const locale = body.locale || "de";

    // Reuse or create Stripe customer
    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: email || undefined,
        metadata: { supabase_user_id: userId },
      });
      customerId = customer.id;

      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", userId);
    }

    // Determine origin for redirect URLs
    const origin = req.headers.get("origin") || "https://smart-lex.de";

    // Create Checkout Session with initial payment
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      line_items: [
        {
          price: STRIPE_PRICES.initial,
          quantity: 1,
        },
      ],
      success_url: `${origin}/${locale}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/${locale}/checkout/cancel`,
      metadata: {
        supabase_user_id: userId,
        referral_code: referralCode || "",
        type: "initial",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: "Zahlungsfehler. Bitte versuchen Sie es erneut." },
      { status: 500 }
    );
  }
}
