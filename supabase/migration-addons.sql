-- ============================================================
-- ComplyRadar Phase 2 — Addon Tables
-- Run this in Supabase SQL Editor after the base migration
-- Dashboard > SQL Editor > New Query > paste & run
-- ============================================================

-- 1. risk_reports table
create table if not exists public.risk_reports (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scans on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  report jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- 2. recommendations table
create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scans on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  report jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- 3. newsletter_preferences table
create table if not exists public.newsletter_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  opted_in boolean not null default false,
  frequency text not null default 'weekly' check (frequency in ('weekly', 'monthly')),
  areas text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- Indexes
create index if not exists idx_risk_reports_scan_id on public.risk_reports (scan_id);
create index if not exists idx_risk_reports_user_id on public.risk_reports (user_id);
create index if not exists idx_recommendations_scan_id on public.recommendations (scan_id);
create index if not exists idx_recommendations_user_id on public.recommendations (user_id);
create index if not exists idx_newsletter_preferences_user_id on public.newsletter_preferences (user_id);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

alter table public.risk_reports enable row level security;
alter table public.recommendations enable row level security;
alter table public.newsletter_preferences enable row level security;

-- risk_reports
create policy "Users can view own risk reports"
  on public.risk_reports for select
  using (auth.uid() = user_id);

create policy "Users can insert own risk reports"
  on public.risk_reports for insert
  with check (auth.uid() = user_id);

create policy "Users can update own risk reports"
  on public.risk_reports for update
  using (auth.uid() = user_id);

create policy "Users can delete own risk reports"
  on public.risk_reports for delete
  using (auth.uid() = user_id);

-- recommendations
create policy "Users can view own recommendations"
  on public.recommendations for select
  using (auth.uid() = user_id);

create policy "Users can insert own recommendations"
  on public.recommendations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own recommendations"
  on public.recommendations for update
  using (auth.uid() = user_id);

create policy "Users can delete own recommendations"
  on public.recommendations for delete
  using (auth.uid() = user_id);

-- newsletter_preferences
create policy "Users can view own newsletter preferences"
  on public.newsletter_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert own newsletter preferences"
  on public.newsletter_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update own newsletter preferences"
  on public.newsletter_preferences for update
  using (auth.uid() = user_id);

create policy "Users can delete own newsletter preferences"
  on public.newsletter_preferences for delete
  using (auth.uid() = user_id);
