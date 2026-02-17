-- Migration: Add status column for tracking generation progress
-- Allows clients to detect in-progress generation when reopening the page

ALTER TABLE public.risk_reports
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'complete';

ALTER TABLE public.recommendations
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'complete';
