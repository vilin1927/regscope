# ComplyRadar — Project Status

> **Last updated:** 2026-02-16
> **Deployment:** [regscope-nine.vercel.app](https://regscope-nine.vercel.app)
> **Repo:** [vilin1927/regscope](https://github.com/vilin1927/regscope)

---

## Current State: Phase 2 Complete (All Addons Live)

The core product and all Phase 2 addon features are **production-ready** and deployed on Vercel.

---

## Implemented Features

### Core Compliance Flow
- **7-layer carpentry questionnaire** — Company info, Employees, Premises & Safety, Products & Sales, Procurement, Environment, Insurance
- **Conditional logic** — Fields show/hide based on answers (e.g., safety officer question appears when >10 employees)
- **"No company yet" toggle** — Switches to planning mode with adapted wording
- **Field validation** — Required fields enforced, toggle validation respects `required` flag
- **Conditional field cleanup** — When a triggering field changes, dependent values are cleared
- **AI-powered regulation matching** — OpenAI GPT integration via `/api/scan` endpoint
- **Processing screen** — 5-step animated progress with carpentry-specific messages
- **Results dashboard** — Stats bar, business profile summary, regulation cards grouped by category

### Regulation Cards
- Jurisdiction badges (EU / Federal / State / Industry)
- Risk level badges (High / Medium / Low) with color coding
- Status classification (Fulfilled / Review Needed / Missing)
- Plain-language summary, key requirements, potential penalty
- "Why this applies to you" — personalized explanation
- Compliance checkboxes (persist to Supabase for authenticated users)
- Official source links
- Null-safe rendering with fallback values

### Authentication & Persistence
- Supabase Auth (email + password)
- Sign up / Sign in / Sign out with logout confirmation dialog
- Guest mode (1 scan, no persistence)
- Password validation: min 8 chars, uppercase, number required
- Scan history saved to Supabase (authenticated users)
- Compliance checkbox state persisted per scan
- Session persistence across browser refreshes

### Scan History
- View past scans with date, business name, regulation count, compliance score
- Re-open full results from any previous scan
- Loads compliance checks from Supabase `compliance_checks` table
- Tracks `currentScanId` for correct checkbox association
- Error feedback via `scanLoadError` state
- `clearHistory()` on sign-out to prevent data leakage

### Internationalization (i18n)
- Bilingual: German (default) + English
- next-intl with locale routing (`/de`, `/en`)
- Language switcher with flag emojis in header
- All UI strings in translation files (`messages/de.json`, `messages/en.json`)
- Dynamic metadata per locale (title, description, hreflang)
- Business profile summary fully translated (no hardcoded German)

### UI / Navigation
- Sidebar with section grouping: Compliance, Analysis, System
- "Soon" badges on upcoming features (compact blue pills, consistent alignment)
- Mobile detection with desktop-only message
- Settings screen with language toggle + account management
- Legal pages: Impressum + Datenschutzerklärung

### API Security (`/api/scan`)
- Server-side Supabase auth verification (guest fallback allowed)
- In-memory rate limiting (10 requests/min per IP)
- Required profile field validation (`industry`, `employeeCount`)
- Request body JSON parse safety
- 60-second fetch timeout with AbortController
- AI response JSON parse error handling (502 on malformed response)

---

## Known Limitations

| Issue | Details | Workaround |
|-------|---------|------------|
| Large profile scan timeout | Vercel free tier has 10s serverless function limit; complex profiles may hit 504 | Works fine with typical profiles; upgrade to Vercel Pro for 60s limit |
| Root `<html lang>` attribute | Next.js 16 root layout doesn't receive `params`; lang is set at `[locale]/layout.tsx` level | Locale-specific layouts handle it correctly |
| In-memory rate limiter | Resets on cold starts (serverless) | Acceptable for MVP; move to Redis/Upstash for production scale |

---

## Phase 2 Features (Live)

| Feature | Status | Description |
|---------|--------|-------------|
| **Risk Analysis** | Live | AI-powered gap analysis with severity table, deadlines, penalty exposure, mitigation recommendations |
| **Recommendations** | Live | Prioritized action list grouped by timeline, action/insurance types, enriched by risk analysis |
| **Newsletter** | Live | Preference management (opt-in, frequency, areas), React Email template, Resend integration |

### Phase 2 Architecture
- 3 new API routes with shared helpers (`lib/api-helpers.ts`)
- 3 new Supabase tables with RLS (`risk_reports`, `recommendations`, `newsletter_preferences`)
- Admin newsletter send endpoint (`/api/send-newsletter`)
- New dependencies: `resend`, `@react-email/components`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router + Turbopack) |
| Language | TypeScript 5.x |
| UI | React 19.x |
| Styling | Tailwind CSS 4.x |
| Animation | Framer Motion 12.x |
| Icons | Lucide React |
| i18n | next-intl |
| Auth & DB | Supabase (Auth + PostgreSQL) |
| AI | OpenAI API (GPT-5.2) |
| Deployment | Vercel (free tier) |

---

## Environment Variables (Vercel)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
OPENAI_API_KEY
OPENAI_MODEL
RESEND_API_KEY
RESEND_DOMAIN
ADMIN_EMAIL
ADMIN_API_KEY
SUPABASE_SERVICE_ROLE_KEY
```

---

## Recent Changes (2026-02-12 → 2026-02-13)

### Restructure & i18n (Feb 12)
- Modular component architecture (app-shell, auth, questionnaire, results, settings, mockups, processing)
- next-intl integration with locale routing
- Full German + English translation files
- Supabase auth with form validation

### Production Audit — 27 Fixes (Feb 13)
1. API auth check + rate limiting + schema validation
2. Request timeout (60s) + JSON parse safety
3. Toggle validation fix
4. Scan history: compliance checks persistence + currentScanId tracking + error feedback
5. useProcessing: mounted ref + cleanup + abort on unmount
6. App shell: removed duplicate calls, guest data clearing, screen state validation
7. RegulationCard: null-safe rendering + jurisdiction fallback
8. BusinessProfileSummary: fully translated
9. Dynamic metadata with hreflang
10. Password validation alignment (min 8 chars both flows)
11. Logout confirmation dialog
12. Conditional field cleanup on answer change

### UI Polish (Feb 13)
- Language switcher with flag emojis + language names
- Sidebar "Soon" badges: compact, blue, consistently aligned
