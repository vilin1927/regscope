-- ============================================================
-- ComplyRadar M3 — Two-Tier Commission Model
-- Splits single commission_rate into initial + recurring
-- Run after migration-m3.sql
-- ============================================================

-- Rename existing column
ALTER TABLE public.consultants RENAME COLUMN commission_rate TO commission_rate_initial;

-- Update default to 30%
ALTER TABLE public.consultants ALTER COLUMN commission_rate_initial SET DEFAULT 30.00;

-- Add recurring commission column
ALTER TABLE public.consultants ADD COLUMN commission_rate_recurring numeric(5,2) NOT NULL DEFAULT 10.00;

-- Update existing consultants to new defaults
UPDATE public.consultants SET commission_rate_initial = 30.00, commission_rate_recurring = 10.00;
