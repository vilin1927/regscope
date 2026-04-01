-- M2: Stripe subscription fields on profiles
-- Run this in Supabase SQL Editor

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_period_end timestamptz;

-- Index for quick lookups by stripe customer
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);

-- Add commission_earned columns to referrals for tracking real payments
ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS commission_initial numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_recurring numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_commission_at timestamptz;

COMMENT ON COLUMN public.profiles.subscription_status IS 'free | active | past_due | cancelled | expired';
