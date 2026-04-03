import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/db/auth-checks";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { stripe, STRIPE_PRICES } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId, email } = authResult;

    // Get user profile
    const [profile] = await db
      .select({ stripeCustomerId: profiles.stripeCustomerId })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    // Check for referral code and locale in request body
    const body = await req.json().catch(() => ({}));
    const referralCode = body.referral_code || null;
    const locale = body.locale || "de";

    // Reuse or create Stripe customer
    let customerId = profile?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: email || undefined,
        metadata: { user_id: userId },
      });
      customerId = customer.id;

      await db
        .update(profiles)
        .set({ stripeCustomerId: customerId })
        .where(eq(profiles.id, userId));
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
        user_id: userId,
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
