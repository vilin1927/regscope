-- Migration: Add UNIQUE constraints for re-run support
-- Ensures only one report per (scan_id, user_id) pair

ALTER TABLE public.risk_reports
  ADD CONSTRAINT risk_reports_scan_user_unique UNIQUE (scan_id, user_id);

ALTER TABLE public.recommendations
  ADD CONSTRAINT recommendations_scan_user_unique UNIQUE (scan_id, user_id);
