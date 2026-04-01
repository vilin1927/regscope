-- ============================================================
-- ComplyRadar Phase 2 M3 — Consultant & Referral System
-- Run this in Supabase SQL Editor after the base + addon migrations
-- Dashboard > SQL Editor > New Query > paste & run
-- ============================================================

-- 1. consultants table — Consultant profiles linked to auth.users
create table if not exists public.consultants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  email text not null,
  phone text,
  bio text,
  tags text[] not null default '{}',
  referral_code text not null unique,
  commission_rate numeric(5,2) not null default 10.00,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- 2. referrals table — Tracks which customer signed up with which consultant's code
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referral_code text not null,
  consultant_id uuid not null references public.consultants on delete cascade,
  customer_user_id uuid not null references auth.users on delete cascade,
  status text not null default 'active' check (status in ('active', 'converted', 'expired')),
  created_at timestamptz not null default now(),
  unique (customer_user_id)
);

-- 3. help_requests table — When a customer clicks "Get Professional Help"
create table if not exists public.help_requests (
  id uuid primary key default gen_random_uuid(),
  customer_user_id uuid not null references auth.users on delete cascade,
  consultant_id uuid references public.consultants on delete set null,
  category text not null,
  message text,
  status text not null default 'pending' check (status in ('pending', 'contacted', 'resolved', 'cancelled')),
  contact_revealed boolean not null default false,
  customer_email text,
  customer_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_consultants_user_id on public.consultants (user_id);
create index if not exists idx_consultants_referral_code on public.consultants (referral_code);
create index if not exists idx_referrals_consultant_id on public.referrals (consultant_id);
create index if not exists idx_referrals_customer_user_id on public.referrals (customer_user_id);
create index if not exists idx_help_requests_consultant_id on public.help_requests (consultant_id);
create index if not exists idx_help_requests_customer_user_id on public.help_requests (customer_user_id);
create index if not exists idx_help_requests_status on public.help_requests (status);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

alter table public.consultants enable row level security;
alter table public.referrals enable row level security;
alter table public.help_requests enable row level security;

-- consultants: own profile only (admin uses service role to bypass)
create policy "Consultants can view own profile"
  on public.consultants for select
  using (auth.uid() = user_id);

create policy "Consultants can update own profile"
  on public.consultants for update
  using (auth.uid() = user_id);

create policy "Consultants can insert own profile"
  on public.consultants for insert
  with check (auth.uid() = user_id);

-- consultants: public read for active consultants (needed for referral validation + matching)
create policy "Anyone can view active consultants"
  on public.consultants for select
  using (is_active = true);

-- referrals: consultants see their referrals, customers see their own
create policy "Consultants can view their referrals"
  on public.referrals for select
  using (consultant_id in (select id from public.consultants where user_id = auth.uid()));

create policy "Customers can view own referral"
  on public.referrals for select
  using (auth.uid() = customer_user_id);

create policy "System can insert referrals"
  on public.referrals for insert
  with check (auth.uid() = customer_user_id);

-- help_requests: consultants see requests assigned to them, customers see their own
create policy "Consultants can view their help requests"
  on public.help_requests for select
  using (consultant_id in (select id from public.consultants where user_id = auth.uid()));

create policy "Consultants can update their help requests"
  on public.help_requests for update
  using (consultant_id in (select id from public.consultants where user_id = auth.uid()));

create policy "Customers can view own help requests"
  on public.help_requests for select
  using (auth.uid() = customer_user_id);

create policy "Customers can insert help requests"
  on public.help_requests for insert
  with check (auth.uid() = customer_user_id);

create policy "Customers can update own help requests"
  on public.help_requests for update
  using (auth.uid() = customer_user_id);
