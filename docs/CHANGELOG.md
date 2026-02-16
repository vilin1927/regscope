# Changelog

## 2026-02-16 — Phase 2: Live Addons (Risk Analysis, Recommendations, Newsletter)

All three addon features are now fully functional, replacing the previous "In Preparation" mockups.

### New Features
- **Risk Analysis** — AI-powered gap analysis with severity table, deadlines, penalty exposure, and mitigation recommendations. Persists to Supabase `risk_reports` table.
- **Recommendations** — Prioritized action list grouped by timeline (immediate/short-term/planned), with insurance vs action distinction. Enriched by risk analysis when available. Persists to `recommendations` table.
- **Newsletter** — Preference management (opt-in, frequency, compliance areas) with auto-save. React Email template for digest emails. Admin send endpoint via Resend API.

### Architecture
- **3 new API routes:** `/api/risk-analysis`, `/api/recommendations`, `/api/newsletter/preferences`
- **Admin endpoint:** `/api/send-newsletter` (Resend integration, service role key)
- **Shared utilities:** `lib/api-helpers.ts` (Supabase server client, auth, rate limiting, OpenAI wrapper)
- **Type definitions:** `types/addons.ts` (RiskReport, RecommendationReport, NewsletterPreferences)
- **3 new hooks:** `useRiskAnalysis`, `useRecommendations`, `useNewsletterPreferences`
- **3 new screen components:** `RiskAnalysisScreen`, `RecommendationsScreen`, `NewsletterScreen`
- **Database migration:** `supabase/migration-addons.sql` (3 tables + RLS + indexes)

### Cleanup
- Deleted all mockup components (`components/mockups/`)
- Removed "In Preparation" sidebar badges
- Updated i18n: replaced `Mockups` section with `RiskAnalysis`, `Recommendations`, `Newsletter` sections
- Updated Header screen title key mappings

### Dependencies
- Added `resend`, `@react-email/components`

### New Environment Variables
- `RESEND_API_KEY` — for newsletter email delivery
- `RESEND_DOMAIN` — sender domain (default: complyradar.de)
- `ADMIN_EMAIL` — admin verification for send endpoint
- `ADMIN_API_KEY` — admin authorization for send endpoint
- `SUPABASE_SERVICE_ROLE_KEY` — for fetching all subscribers

---

## 2026-02-13 — Production Audit (27 Fixes) + UI Polish

Full production readiness audit identified 27 issues across auth, API, questionnaire, results, history, and i18n. All 27 implemented and verified.

### API Security
- Added server-side Supabase auth check on `/api/scan`
- Added in-memory rate limiting (10 req/min per IP)
- Added required profile field validation (`industry`, `employeeCount`)
- Added `request.json()` try/catch for malformed requests
- Added 60s fetch timeout with AbortController
- Added explicit JSON parse error handling for AI responses (returns 502)

### Scan History & Persistence
- Added `currentScanId` tracking for correct checkbox association
- Added `loadComplianceChecks()` from Supabase `compliance_checks` table
- Added `scanLoadError` state for error feedback
- Added `clearHistory()` method for auth transitions
- Fixed `handleComplianceChange` to use `currentScanId` instead of always `scanHistory[0]`

### Processing & Lifecycle
- Added `mountedRef` to prevent state updates after unmount
- Added cleanup that aborts API request on component unmount
- Fixed step count to use `TOTAL_STEPS = 5` consistently

### App Shell
- Removed duplicate `setBusinessProfile` call in `handleQuestionnaireComplete`
- `handleSignOut` now clears scan history to prevent data leakage
- Added screen state validation on load (resets to dashboard if stale state)

### Results & Regulation Cards
- Added null/undefined guards on all regulation fields
- Added jurisdiction badge fallback for unknown values
- Translated all hardcoded German in BusinessProfileSummary

### Questionnaire
- Fixed toggle fields to respect `required` flag in validation
- Added conditional field cleanup when triggering field changes

### Auth & Settings
- Aligned password validation: min 8 chars for both sign-in and sign-up
- Added logout confirmation dialog with confirm/cancel buttons

### i18n & SEO
- Changed `[locale]/layout.tsx` from static metadata to `generateMetadata` with locale-specific title/description
- Added `alternates.languages` for hreflang SEO

### UI Polish
- Language switcher: flag emojis + full language names instead of plain "EN"/"DE"
- Sidebar badges: compact "Soon" pills replacing verbose "IN PREPARATION" text

### Commits
- `3c8a83f` — Add form validation, Supabase persistence, auth validation, and legal pages
- Production audit commit — 27 fixes across 13 files
- UI polish commit — sidebar badges + language switcher

---

## 2026-02-12 — Modular Restructure + i18n + Auth

Complete project restructure from single-file app to modular component architecture with internationalization and authentication.

### Architecture
- Split monolithic `page.tsx` into modular components:
  - `components/app-shell/` — ComplyRadarApp, Header, Sidebar, NavItem
  - `components/auth/` — AuthForm
  - `components/questionnaire/` — QuestionnaireScreen, LayerRenderer, FieldRenderer
  - `components/processing/` — ProcessingScreen
  - `components/results/` — ResultsScreen, RegulationList, RegulationCard, BusinessProfileSummary
  - `components/settings/` — SettingsScreen
  - `components/mockups/` — RiskAnalysisMockup, RecommendationsMockup, NewsletterMockup

### Internationalization
- Integrated next-intl with locale-based routing (`/de`, `/en`)
- Full translation files: `messages/de.json`, `messages/en.json`
- All 7 questionnaire layers, field labels, options translated
- Results, auth, settings, legal pages translated

### Authentication
- Supabase Auth integration (email + password)
- Sign up / Sign in / Guest mode flows
- Form validation (email format, password strength)
- Session persistence

### Data Layer
- 7-layer carpentry questionnaire config (`data/questionnaire/layers.ts`)
- Regulation types and matching (`data/regulations/`)
- OpenAI API integration for regulation scanning (`app/api/scan/route.ts`)

### Legal
- Impressum page
- Datenschutzerklärung (Privacy Policy) page

### Commits
- `96bc456` — Restructure project: modular components, i18n, cleanup dead code
- `3c8a83f` — Add form validation, Supabase persistence, auth validation, and legal pages

---

## 2026-02-10 — Initial Build + Full V2 Action Plan Implementation

Everything built in a single session for Raphael's investor meeting.

### Step 1: Project Setup
- Created standalone Next.js 16 project at `~/Desktop/Autoflux/regscope/`
- Initialized GitHub repo: `vilin1927/regscope`
- Installed dependencies: framer-motion, lucide-react
- Connected to Vercel for auto-deploy from `main`
- Base app adapted from the demo at `autoflux.digital/proposals/orgonic-art-raphael/demo`

### Step 2: Part 1 — Quick Fixes (from Action Plan)
- **Fixed match scores:** GDPR 92%, ePrivacy 85%, DSA 78%, AI Act 71%, NIS2 58% (was all ~55%)
- **Fixed "why applies" text:** Each regulation now has a specific, professional explanation instead of generic text
- **Added risk badges:** High (red, 80%+), Medium (amber, 60-79%), Low (green, <60%) on every regulation card
- **Fixed grammar:** "1 EU countries" → "1 EU country"

### Step 3: Part 2 — Full V2 Rebuild
- **Questionnaire V2 fields:**
  - Company size selector (1-10, 11-50, 51-200, 200+)
  - Target market multi-select (B2B, B2C, B2G)
  - Compliance status (Not started, In progress, Partially compliant, Certified)
  - "No company yet" toggle — switches to pre-launch planning flow
- **Sidebar restructured:**
  - Core section: Dashboard, New Scan
  - Insights section: Risk Analysis (V2), Recommendations (V2), Newsletter (V2)
  - Library section: Settings
- **Results page polish:**
  - Stats bar: Regulations Found, High Priority, EU Coverage, Compliance Score
  - Key Requirements: 3 bullets per regulation card
  - Potential Penalty: red callout with penalty amount per regulation
  - Better business profile summary
- **"In Preparation" tabs with mockups:**
  - Risk Analysis: table with severity, compliance gap, deadline, penalty per regulation
  - Newsletter: email preview template with 3 update cards + frequency toggle (Weekly/Monthly)
  - Recommendations: prioritized checklist with action items, insurance suggestions, and timelines
  - Settings: placeholder with description
- **Data layer rewrite:**
  - 8 EU regulations with keyRequirements[] and potentialPenalty fields
  - Fixed relevance scoring with boosted weights for realistic demo scores
  - Professional generateWhyApplies() per regulation ID
  - V2 questionnaire options (companySizes, targetMarkets, complianceStatuses, dataProcessingOptions)

### Step 4: Post-Build Cleanup
- Removed "Regulations Database" tab from sidebar (per client request)
- Moved all planning docs to `docs/` folder
- Created project documentation (README + this changelog)

### Commits
1. `efe33f5` — Initial RegScope standalone app
2. `323dffb` — Implement full RegScope V2 action plan for investor demo
3. `52f7e10` — Remove Regulations Database tab from sidebar

### Files Modified
- `app/page.tsx` — Full app: dashboard, questionnaire, processing, results, V2 tabs
- `app/layout.tsx` — Metadata updated
- `data/regscope-data.ts` — Regulation database, scoring, questionnaire options
- `docs/` — Planning documents moved here
- `README.md` — Project documentation
