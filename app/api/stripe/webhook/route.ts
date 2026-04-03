import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { profiles, referrals, consultants } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";
import Stripe from "stripe";

// NO auth — Stripe sends webhooks directly

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
  const userId = session.metadata?.user_id;
  if (!userId) {
    console.error("[Stripe] No user_id in session metadata");
    return;
  }

  // Set subscription active for 6 months (initial payment)
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 6);

  await db
    .update(profiles)
    .set({
      stripeCustomerId: session.customer as string,
      subscriptionStatus: "active",
      subscriptionPeriodEnd: periodEnd,
    })
    .where(eq(profiles.id, userId));

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
  const [profile] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.stripeCustomerId, customerId))
    .limit(1);

  if (!profile) {
    console.error(`[Stripe] No profile for customer ${customerId}`);
    return;
  }

  // Extend subscription by 1 month
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await db
    .update(profiles)
    .set({
      subscriptionStatus: "active",
      subscriptionPeriodEnd: periodEnd,
    })
    .where(eq(profiles.id, profile.id));

  console.log(`[Stripe] User ${profile.id} renewed (invoice paid)`);

  // Track recurring commission
  const [referral] = await db
    .select({
      id: referrals.id,
      referralCode: referrals.referralCode,
    })
    .from(referrals)
    .where(
      and(
        eq(referrals.customerUserId, profile.id),
        eq(referrals.status, "converted")
      )
    )
    .limit(1);

  if (referral) {
    await trackCommission(profile.id, referral.referralCode, invoice.amount_paid || 2900, "recurring");
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
  const periodEndUnix = typeof raw.current_period_end === "number"
    ? raw.current_period_end
    : null;
  const periodEnd = periodEndUnix
    ? new Date(periodEndUnix * 1000)
    : null;

  const updateData: Record<string, unknown> = {
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: status,
  };
  if (periodEnd) updateData.subscriptionPeriodEnd = periodEnd;

  await db
    .update(profiles)
    .set(updateData)
    .where(eq(profiles.stripeCustomerId, customerId));

  console.log(`[Stripe] Subscription ${subscription.id} updated -> ${status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  await db
    .update(profiles)
    .set({
      subscriptionStatus: "expired",
      stripeSubscriptionId: null,
    })
    .where(eq(profiles.stripeCustomerId, customerId));

  console.log(`[Stripe] Subscription ${subscription.id} deleted`);
}

async function trackCommission(
  userId: string,
  referralCode: string,
  amountCents: number,
  type: "initial" | "recurring"
) {
  // Find the referral record with consultant commission rates
  const [referral] = await db
    .select({
      id: referrals.id,
      consultantId: referrals.consultantId,
      commissionInitial: referrals.commissionInitial,
      commissionRecurring: referrals.commissionRecurring,
    })
    .from(referrals)
    .where(eq(referrals.customerUserId, userId))
    .limit(1);

  if (!referral) return;

  // Get commission rates from consultant
  const [consultant] = await db
    .select({
      commissionRateInitial: consultants.commissionRateInitial,
      commissionRateRecurring: consultants.commissionRateRecurring,
    })
    .from(consultants)
    .where(eq(consultants.id, referral.consultantId))
    .limit(1);

  const initialRate = consultant ? parseFloat(consultant.commissionRateInitial) : 30;
  const recurringRate = consultant ? parseFloat(consultant.commissionRateRecurring) : 10;

  const rate = type === "initial"
    ? initialRate / 100
    : recurringRate / 100;

  const commission = (amountCents / 100) * rate;

  if (type === "initial") {
    await db
      .update(referrals)
      .set({
        commissionInitial: sql`${referrals.commissionInitial}::numeric + ${commission}`,
        lastCommissionAt: new Date(),
      })
      .where(eq(referrals.id, referral.id));
  } else {
    await db
      .update(referrals)
      .set({
        commissionRecurring: sql`${referrals.commissionRecurring}::numeric + ${commission}`,
        lastCommissionAt: new Date(),
      })
      .where(eq(referrals.id, referral.id));
  }

  console.log(`[Stripe] Commission tracked: EUR ${commission.toFixed(2)} (${type}) for referral ${referral.id}`);
}
