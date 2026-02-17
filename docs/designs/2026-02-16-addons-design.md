# Feature Design: Live Addons (Risk Analysis, Recommendations, Newsletter)

**Date:** 2026-02-16
**Status:** Design
**Priority:** Urgent

---

## Summary

Replace the 3 mockup addon screens with fully functional live features. Each addon is an independent layer on top of the existing scan system — **zero changes to the production `/api/scan` endpoint**.

---

## Architecture

### Core Principle

The existing scan flow is untouched. Addons are independent post-scan features that read scan results from Supabase and produce their own outputs.

### Data Dependency Chain

```
scan (existing, unchanged)
  └── writes regulations to Supabase scans.matched_regulations
        │
        ├── /api/risk-analysis   → reads regulations → OpenAI → risk_reports table
        │
        ├── /api/recommendations → reads regulations + risk data → OpenAI → recommendations table
        │
        └── Newsletter (independent)
              /api/send-newsletter → reads opted-in profiles → EUR-Lex → Resend → email
```

### New API Endpoints

| Endpoint | Method | Auth | Input | Output |
|----------|--------|------|-------|--------|
| `/api/risk-analysis` | POST | User (Supabase session) | `{ scanId }` | `{ riskReport: RiskReportRow }` |
| `/api/recommendations` | POST | User (Supabase session) | `{ scanId }` | `{ recommendations: RecommendationRow[] }` |
| `/api/newsletter/preferences` | GET/PUT | User (Supabase session) | `{ optedIn, frequency, areas }` | `{ preferences }` |
| `/api/send-newsletter` | POST | Admin only | `{}` | `{ sent: number, errors: number }` |

---

## Data Model

### New Supabase Tables

#### `risk_reports`
```sql
create table if not exists public.risk_reports (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scans on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  report jsonb not null default '[]',
  -- report: array of { regulationId, regulationName, gap, severity, deadline, penaltyExposure, mitigationSteps[] }
  created_at timestamptz not null default now()
);
```

#### `recommendations`
```sql
create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scans on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  risk_report_id uuid references public.risk_reports on delete set null,
  items jsonb not null default '[]',
  -- items: array of { action, priority (1-5), timeline (immediate|soon|planned), type (action|insurance), regulationId, details }
  created_at timestamptz not null default now()
);
```

#### `newsletter_preferences`
```sql
create table if not exists public.newsletter_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade unique,
  opted_in boolean not null default false,
  frequency text not null default 'monthly' check (frequency in ('weekly', 'monthly')),
  areas text[] not null default '{}',
  -- areas: subset of RegulationCategory values the user cares about
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### RLS Policies

All three tables follow the existing pattern:
- Users can SELECT/INSERT/UPDATE/DELETE their own rows (`auth.uid() = user_id`)
- `send-newsletter` endpoint uses service role key to read all opted-in users

### Indexes
```sql
create index idx_risk_reports_scan_id on public.risk_reports (scan_id);
create index idx_recommendations_scan_id on public.recommendations (scan_id);
create index idx_newsletter_preferences_user_id on public.newsletter_preferences (user_id);
create index idx_newsletter_preferences_opted_in on public.newsletter_preferences (opted_in) where opted_in = true;
```

---

## API Design

### 1. POST `/api/risk-analysis`

**Request:**
```json
{ "scanId": "uuid" }
```

**Process:**
1. Verify auth (Supabase session)
2. Read scan from `scans` table (verify `user_id` matches)
3. Extract `matched_regulations` and `business_profile`
4. Send to OpenAI with risk analysis prompt
5. Validate + store in `risk_reports` table
6. Return risk report

**OpenAI Prompt Focus:**
- For each matched regulation with status "fehlend" or "pruefung":
  - Identify specific compliance gap
  - Assess severity (kritisch / hoch / mittel / niedrig)
  - Estimate realistic compliance deadline
  - Calculate penalty exposure
  - Suggest mitigation steps

**Response:**
```json
{
  "riskReport": {
    "id": "uuid",
    "scanId": "uuid",
    "items": [
      {
        "regulationId": "arbschg",
        "regulationName": "Arbeitsschutzgesetz",
        "gap": "Keine Gefährdungsbeurteilung durchgeführt",
        "severity": "kritisch",
        "deadline": "2026-06-30",
        "penaltyExposure": "Bußgeld bis 25.000€",
        "mitigationSteps": [
          "Fachkraft für Arbeitssicherheit beauftragen",
          "Gefährdungsbeurteilung für alle Arbeitsplätze erstellen",
          "Dokumentation gemäß §6 ArbSchG führen"
        ]
      }
    ],
    "createdAt": "2026-02-16T..."
  }
}
```

### 2. POST `/api/recommendations`

**Request:**
```json
{ "scanId": "uuid" }
```

**Process:**
1. Verify auth
2. Read scan from `scans` table
3. Optionally read existing `risk_reports` for this scan (enriches recommendations)
4. Send to OpenAI with recommendations prompt
5. Store in `recommendations` table
6. Return recommendations

**OpenAI Prompt Focus:**
- Given regulations + risk data, generate prioritized action plan:
  - Concrete action items with step-by-step guidance
  - Priority ranking (1 = most urgent)
  - Timeline: immediate (within 2 weeks), soon (within 3 months), planned (within 12 months)
  - Type: action (compliance task) or insurance (insurance-related)
  - Link each recommendation to its source regulation

**Response:**
```json
{
  "recommendations": {
    "id": "uuid",
    "scanId": "uuid",
    "items": [
      {
        "action": "Gefährdungsbeurteilung durchführen",
        "priority": 1,
        "timeline": "immediate",
        "type": "action",
        "regulationId": "arbschg",
        "details": "Beauftragen Sie eine Fachkraft für Arbeitssicherheit..."
      }
    ],
    "createdAt": "2026-02-16T..."
  }
}
```

### 3. GET/PUT `/api/newsletter/preferences`

**GET** — returns current user's newsletter preferences
**PUT** — updates preferences

**Request (PUT):**
```json
{
  "optedIn": true,
  "frequency": "weekly",
  "areas": ["arbeitssicherheit", "umweltrecht", "datenschutz"]
}
```

### 4. POST `/api/send-newsletter`

**Auth:** Admin only (check against `ADMIN_EMAIL` env var or Supabase role)

**Process:**
1. Verify admin auth
2. Fetch all users with `opted_in = true` from `newsletter_preferences`
3. For each user, fetch their latest scan from `scans` table
4. Fetch EUR-Lex regulation updates (or cached regulatory feed)
5. Match updates against user's selected `areas`
6. Render React Email template per user
7. Send via Resend API
8. Return send count + errors

---

## Component Design

### New Screens (replace mockups)

#### `RiskAnalysisScreen`
- Shows risk report if one exists for current scan
- "Run Risk Analysis" button if no report yet → calls `/api/risk-analysis`
- Loading state while OpenAI processes
- Severity table (reuse existing table design from mockup, but with real data)
- Error state with retry

#### `RecommendationsScreen`
- Shows recommendations if they exist for current scan
- "Generate Recommendations" button if none yet → calls `/api/recommendations`
- Loading state
- Prioritized action list (reuse mockup design, real data)
- Insurance recommendations highlighted separately

#### `NewsletterScreen`
- **Not scan-result dependent** — this is a preferences screen
- Opt-in toggle
- Frequency selector (weekly / monthly)
- Compliance area multi-select (checkboxes for each `RegulationCategory`)
- Preview section showing what the digest template looks like
- Saves preferences via `/api/newsletter/preferences`

### Removed Components
- `InPrepScreen` wrapper — no longer needed
- Mockup components become real components (or get replaced entirely)
- Sidebar badges ("In Preparation") — removed

### New Hooks
- `useRiskAnalysis(scanId)` — fetch/trigger risk report, loading state
- `useRecommendations(scanId)` — fetch/trigger recommendations, loading state
- `useNewsletterPreferences(userId)` — CRUD newsletter preferences

---

## Error Handling

**Strategy: Graceful Degradation**

- If risk analysis OpenAI call fails → show error message on Risk Analysis screen, scan results still accessible
- If recommendations call fails → same, independent failure
- If newsletter preferences fail to save → show inline error, retry button
- If newsletter send fails for some users → return partial success count + error list
- Rate limiting: reuse existing pattern from `/api/scan`
- Timeout: 60s for OpenAI calls (same as scan)

---

## Dependencies

### New npm packages
- `resend` — email sending API
- `@react-email/components` — React Email templates

### External services
- **OpenAI** — already configured, reuse `OPENAI_API_KEY` env var
- **Resend** — new, requires `RESEND_API_KEY` env var
- **EUR-Lex / regulatory feed** — for newsletter content (can start with curated content, add real feed later)

### Environment Variables (new)
```
RESEND_API_KEY=re_xxxxx
ADMIN_EMAIL=raphael@example.com
```

---

## Implementation Tasks

### Phase 1: Risk Analysis (highest priority — builds on scan)

- [ ] **Create Supabase migration for `risk_reports` table** `priority:1` `phase:data`
  - files: `supabase/migration-addons.sql`
  - RLS policies, indexes

- [ ] **Build `/api/risk-analysis` endpoint** `priority:2` `phase:api`
  - files: `app/api/risk-analysis/route.ts`
  - Auth check, read scan from Supabase, OpenAI prompt, validate response, store result

- [ ] **Create `useRiskAnalysis` hook** `priority:3` `phase:logic`
  - files: `hooks/useRiskAnalysis.ts`
  - Fetch existing report, trigger new analysis, loading/error state

- [ ] **Build `RiskAnalysisScreen` component** `priority:4` `phase:ui`
  - files: `components/risk-analysis/RiskAnalysisScreen.tsx`
  - Replace mockup, severity table with real data, trigger button, loading state

- [ ] **Wire Risk Analysis into app shell** `priority:5` `phase:integration`
  - files: `components/app-shell/ComplyRadarApp.tsx`, `components/app-shell/Sidebar.tsx`
  - Replace InPrepScreen with RiskAnalysisScreen, remove badge

### Phase 2: Recommendations (depends on risk data)

- [ ] **Add `recommendations` table to migration** `priority:6` `phase:data`
  - files: `supabase/migration-addons.sql`

- [ ] **Build `/api/recommendations` endpoint** `priority:7` `phase:api`
  - files: `app/api/recommendations/route.ts`
  - Reads scan + optional risk report, OpenAI prompt, store result

- [ ] **Create `useRecommendations` hook** `priority:8` `phase:logic`
  - files: `hooks/useRecommendations.ts`

- [ ] **Build `RecommendationsScreen` component** `priority:9` `phase:ui`
  - files: `components/recommendations/RecommendationsScreen.tsx`

- [ ] **Wire Recommendations into app shell** `priority:10` `phase:integration`

### Phase 3: Newsletter (independent track)

- [ ] **Add `newsletter_preferences` table to migration** `priority:11` `phase:data`
  - files: `supabase/migration-addons.sql`

- [ ] **Build `/api/newsletter/preferences` endpoint** `priority:12` `phase:api`
  - files: `app/api/newsletter/preferences/route.ts`

- [ ] **Build React Email digest template** `priority:13` `phase:ui`
  - files: `emails/DigestEmail.tsx`
  - ComplyRadar header, personalized greeting, regulation updates by category, risk indicators, dashboard link, unsubscribe link

- [ ] **Build `/api/send-newsletter` endpoint** `priority:14` `phase:api`
  - files: `app/api/send-newsletter/route.ts`
  - Admin auth, fetch opted-in users, EUR-Lex updates, render template, send via Resend

- [ ] **Create `useNewsletterPreferences` hook** `priority:15` `phase:logic`
  - files: `hooks/useNewsletterPreferences.ts`

- [ ] **Build `NewsletterScreen` component** `priority:16` `phase:ui`
  - files: `components/newsletter/NewsletterScreen.tsx`
  - Opt-in toggle, frequency selector, area checkboxes, preview

- [ ] **Wire Newsletter into app shell** `priority:17` `phase:integration`

### Phase 4: Cleanup

- [ ] **Remove mockup components and InPrepScreen** `priority:18` `phase:cleanup`
  - files: `components/mockups/` (delete directory)
  - Remove sidebar badges, update i18n keys

- [ ] **Add i18n translations for all new screens** `priority:19` `phase:i18n`
  - files: `messages/de.json`, `messages/en.json`

- [ ] **Update STATUS.md and CHANGELOG.md** `priority:20` `phase:docs`
