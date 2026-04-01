-- ============================================================
-- ComplyRadar M3 — Legal Compliance (Disclaimer Acknowledgments)
-- Stores when a user acknowledged the results disclaimer
-- ============================================================

create table if not exists public.disclaimer_acknowledgments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  scan_id text not null,
  acknowledged_at timestamptz not null default now()
);

create index if not exists idx_disclaimer_ack_user on public.disclaimer_acknowledgments (user_id);

alter table public.disclaimer_acknowledgments enable row level security;

create policy "Users can view own acknowledgments"
  on public.disclaimer_acknowledgments for select
  using (auth.uid() = user_id);

create policy "Users can insert own acknowledgments"
  on public.disclaimer_acknowledgments for insert
  with check (auth.uid() = user_id);

-- Contact consent: stored as a flag on the user's profile
-- We add a column to consultants... no, this is for customers.
-- Add to profiles table:
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contact_consent_given boolean NOT NULL DEFAULT false;
