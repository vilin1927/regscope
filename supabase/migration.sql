-- ============================================================
-- ComplyRadar MVP Schema
-- Run this in Supabase SQL Editor once after project creation
-- Dashboard > SQL Editor > New Query > paste & run
-- ============================================================

-- 1. profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  language text not null default 'de' check (language in ('de', 'en')),
  created_at timestamptz not null default now()
);

-- 2. scans table
create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  business_profile jsonb not null default '{}',
  matched_regulations jsonb not null default '[]',
  compliance_score numeric not null default 0,
  created_at timestamptz not null default now()
);

-- 3. compliance_checks table
create table if not exists public.compliance_checks (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scans on delete cascade,
  regulation_id text not null,
  checked boolean not null default false,
  checked_at timestamptz not null default now(),
  unique (scan_id, regulation_id)
);

-- Indexes
create index if not exists idx_scans_user_id on public.scans (user_id);
create index if not exists idx_scans_created_at on public.scans (created_at desc);
create index if not exists idx_compliance_checks_scan_id on public.compliance_checks (scan_id);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

alter table public.profiles enable row level security;
alter table public.scans enable row level security;
alter table public.compliance_checks enable row level security;

-- profiles
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- scans
create policy "Users can view own scans"
  on public.scans for select
  using (auth.uid() = user_id);

create policy "Users can insert own scans"
  on public.scans for insert
  with check (auth.uid() = user_id);

create policy "Users can update own scans"
  on public.scans for update
  using (auth.uid() = user_id);

create policy "Users can delete own scans"
  on public.scans for delete
  using (auth.uid() = user_id);

-- compliance_checks (ownership verified via scans table)
create policy "Users can view own compliance checks"
  on public.compliance_checks for select
  using (scan_id in (select id from public.scans where user_id = auth.uid()));

create policy "Users can insert own compliance checks"
  on public.compliance_checks for insert
  with check (scan_id in (select id from public.scans where user_id = auth.uid()));

create policy "Users can update own compliance checks"
  on public.compliance_checks for update
  using (scan_id in (select id from public.scans where user_id = auth.uid()));

create policy "Users can delete own compliance checks"
  on public.compliance_checks for delete
  using (scan_id in (select id from public.scans where user_id = auth.uid()));

-- ============================================================
-- Auto-create profile on signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, language)
  values (new.id, 'de');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
