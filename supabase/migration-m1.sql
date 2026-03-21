-- Phase 2 M1: Industry Templates for Dynamic Questionnaire
-- Caches AI-generated questionnaire templates by industry code.
-- Once generated, the same industry gets the cached template (no re-generation).

CREATE TABLE IF NOT EXISTS industry_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  industry_code TEXT UNIQUE NOT NULL,
  industry_label TEXT NOT NULL,
  questions JSONB NOT NULL,
  gegenstand_sample TEXT,
  usage_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by industry code
CREATE INDEX IF NOT EXISTS idx_industry_templates_code ON industry_templates(industry_code);

-- RLS: Allow read access for authenticated users, write for service role
ALTER TABLE industry_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read industry templates"
  ON industry_templates FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage industry templates"
  ON industry_templates FOR ALL
  USING (true)
  WITH CHECK (true);
