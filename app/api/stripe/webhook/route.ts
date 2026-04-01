import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_PRICES } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

// Use service role for webhook (no user auth context)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log(`[Stripe Webhook] ${event.type} — ${event.id}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event: ${event.type}`);
    }
  } catch (err) {
    console.error(`[Stripe Webhook] Error handling ${event.type}:`, err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabase_user_id;
  if (!userId) {
    console.error("[Stripe] No supabase_user_id in session metadata");
    return;
  }

  // Set subscription active for 6 months (initial payment)
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 6);

  await supabase
    .from("profiles")
    .update({
      stripe_customer_id: session.customer as string,
      subscription_status: "active",
      subscription_period_end: periodEnd.toISOString(),
    })
    .eq("id", userId);

  console.log(`[Stripe] User ${userId} activated (initial payment, 6mo)`);

  // Track commission if referred
  const referralCode = session.metadata?.referral_code;
  if (referralCode) {
    await trackCommission(userId, referralCode, session.amount_total || 19500, "initial");
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  // Find user by stripe_customer_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!profile) {
    console.error(`[Stripe] No profile for customer ${customerId}`);
    return;
  }

  // Extend subscription by 1 month
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await supabase
    .from("profiles")
    .update({
      subscription_status: "active",
      subscription_period_end: periodEnd.toISOString(),
    })
    .eq("id", profile.id);

  console.log(`[Stripe] User ${profile.id} renewed (invoice paid)`);

  // Track recurring commission
  const { data: referral } = await supabase
    .from("referrals")
    .select("id, referral_code")
    .eq("referred_user_id", profile.id)
    .eq("status", "converted")
    .single();

  if (referral) {
    await trackCommission(profile.id, referral.referral_code, invoice.amount_paid || 2900, "recurring");
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const statusMap: Record<string, string> = {
    active: "active",
    past_due: "past_due",
    canceled: "cancelled",
    unpaid: "expired",
  };

  const status = statusMap[subscription.status] || "free";

  // current_period_end may not be in the typed SDK — access via raw object
  const raw = subscription as unknown as Record<string, unknown>;
  const periodEnd = typeof raw.current_period_end === "number"
    ? new Date(raw.current_period_end * 1000).toISOString()
    : null;

  const updateData: Record<string, unknown> = {
    stripe_subscription_id: subscription.id,
    subscription_status: status,
  };
  if (periodEnd) updateData.subscription_period_end = periodEnd;

  await supabase
    .from("profiles")
    .update(updateData)
    .eq("stripe_customer_id", customerId);

  console.log(`[Stripe] Subscription ${subscription.id} updated → ${status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  await supabase
    .from("profiles")
    .update({
      subscription_status: "expired",
      stripe_subscription_id: null,
    })
    .eq("stripe_customer_id", customerId);

  console.log(`[Stripe] Subscription ${subscription.id} deleted`);
}

async function trackCommission(
  userId: string,
  referralCode: string,
  amountCents: number,
  type: "initial" | "recurring"
) {
  // Find the referral record
  const { data: referral } = await supabase
    .from("referrals")
    .select("id, initial_commission_rate, recurring_commission_rate, commission_initial, commission_recurring")
    .eq("referred_user_id", userId)
    .single();

  if (!referral) return;

  const rate = type === "initial"
    ? (referral.initial_commission_rate || 30) / 100
    : (referral.recurring_commission_rate || 10) / 100;

  const commission = (amountCents / 100) * rate;

  const update = type === "initial"
    ? { commission_initial: (referral.commission_initial || 0) + commission }
    : { commission_recurring: (referral.commission_recurring || 0) + commission };

  await supabase
    .from("referrals")
    .update({ ...update, last_commission_at: new Date().toISOString() })
    .eq("id", referral.id);

  console.log(`[Stripe] Commission tracked: €${commission.toFixed(2)} (${type}) for referral ${referral.id}`);
}
