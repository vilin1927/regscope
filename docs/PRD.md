# Product Requirements Document: ComplyRadar

> **Version:** 2.0
> **Date:** 2026-02-12
> **Author:** Autoflux (for Raphael / Fabian)
> **Status:** Draft — Pending approval

---

## 1. Overview

### 1.1 Purpose

ComplyRadar is a compliance discovery tool that tells small business owners exactly which laws apply to their business — in plain language, organized by jurisdiction, with risk analysis and actionable next steps.

### 1.2 Background

A carpenter in Germany currently has no single source to understand their full compliance picture. EU regulations, German federal laws (Bundesgesetze), regional rules (Landesrecht), and industry-specific safety standards (DGUV, Handwerksordnung) are scattered across dozens of legal databases in legal jargon. Raphael wants one tool where a business owner answers simple questions and gets a clear, complete picture.

The existing prototype (regscope-nine.vercel.app) was built for an investor demo. It covers 8 generic EU regulations with a 3-step questionnaire aimed at tech/healthcare/finance companies. The target product is fundamentally different: deep industry-specific questionnaires starting with German carpentry (Tischlerei/Schreinerei), jurisdiction hierarchy (EU → Bundesrecht → Landesrecht), and a framework designed to expand to other Handwerk trades.

### 1.3 Scope

**This PRD covers:**
- Phase 1 (MVP): Functional product with auth, mock regulation data for German carpentry, scan history
- Phase 2 (AI + Live data): GPT-powered analysis, real data sources, email delivery
- Future roadmap items (documented but not specced)

**Product name:** ComplyRadar (pending domain: complyradar.de or complyradar.eu)
**Current deployment:** regscope-nine.vercel.app (to be migrated)
**Language:** Bilingual — German (default) + English, user-selectable

---

## 2. Goals and Objectives

### 2.1 Business Goals

| Goal | Measure |
|------|---------|
| Validate product-market fit with German Handwerk trades | 10+ carpentry businesses complete a scan in first month post-launch |
| Build scalable framework for multi-niche expansion | Adding a new trade requires only new branch content, not framework changes |
| Establish ComplyRadar as the compliance entry point for SMEs | Organic traffic from German trade searches |
| Long-term AI learning | System learns from business names to auto-suggest industry type (Phase 3) |

### 2.2 User Goals

| User | Goal |
|------|------|
| Carpenter (Tischlermeister) | Understand all laws that apply to my workshop without reading legal texts |
| Business owner planning to start | Know what compliance I need BEFORE opening |
| Existing business checking gaps | Find out what I'm missing and what's urgent |
| Returning user | Re-run scans, view history, track compliance progress over time |

### 2.3 Success Metrics (KPIs)

| KPI | Target | How measured |
|-----|--------|-------------|
| Questionnaire completion rate | >70% | Users who start step 1 and reach results |
| Time to complete questionnaire | <8 minutes | Session timing |
| Scan-to-checkbox interaction | >40% | Users who tick at least 1 compliance checkbox |
| Return visit rate | >25% within 30 days | Analytics |
| Account creation rate | >50% of completed scans | Auth tracking |

---

## 3. Target Users

### 3.1 User Personas

**Primary: Hans, 52 — Tischlermeister in Bavaria**
- Runs a 6-person carpentry workshop (Schreinerei) in Rosenheim
- Employs 4 Gesellen + 1 Lehrling + 1 office staff
- Sells custom furniture B2C and kitchen installations B2B
- Has basic insurance but unsure if it's complete
- Never heard of half the EU regulations that affect him
- Uses a Steuerberater (tax advisor) but no compliance advisor
- Tech comfort: uses smartphone, email, basic web — not a power user

**Secondary: Lisa, 29 — Planning to open a Tischlerei**
- Completing her Meisterprüfung, wants to open her own shop
- Needs to know compliance requirements BEFORE she starts
- Looking at workshop spaces in Hamburg
- "No company yet" flow — pre-launch planning mode

**Tertiary: Investor / Fabian (business partner)**
- Needs to see a polished, credible product
- Wants to understand the growth path (multi-niche, SaaS potential)
- "In Preparation" badges signal roadmap to them, not to end users

### 3.2 User Stories

**Core MVP:**
- As a carpenter, I want to answer questions about my business in normal language so I can see which laws apply to me
- As a carpenter, I want results organized by category (Safety, Employment, Commercial, Environmental) so I can focus on one area at a time
- As a carpenter, I want to see jurisdiction levels (EU, Federal, Regional) for each regulation so I know which authority enforces it
- As a carpenter, I want to check off regulations I already comply with so I can track my progress
- As a business planner, I want a "no company yet" mode so I can scan requirements before I open
- As a user, I want to create an account so my scans and compliance progress persist
- As a returning user, I want to view my past scans and re-run them
- As a user, I want to switch between German and English

**Phase 2 (AI-Powered):**
- As a carpenter, I want AI to analyze my compliance gaps and show risk severity
- As a carpenter, I want a prioritized action list generated from my specific situation
- As a carpenter, I want personalized regulation updates via email
- As a carpenter, I want the system to always return something useful, even when the database has no exact match

### 3.3 Use Cases

| # | Use Case | Trigger | Flow | Outcome |
|---|----------|---------|------|---------|
| UC-1 | First compliance scan | User clicks "Start Scan" | 7-layer questionnaire → processing → results dashboard | Regulations listed by category + jurisdiction |
| UC-2 | Pre-launch scan | User toggles "No company yet" | Adapted questionnaire (planned instead of actual) → results | Same output, framed as "you will need" |
| UC-3 | Track compliance | User ticks checkboxes on results | Checkboxes persist per scan (requires auth) | Visual progress tracking |
| UC-4 | View scan history | User navigates to scan history | List of past scans with date, summary, compliance score | Can re-open or re-run any scan |
| UC-5 | View risk analysis | User navigates to Risk Analysis tab | Severity table with penalties + deadlines | Understands urgency |
| UC-6 | View recommendations | User navigates to Recommendations tab | Prioritized action items + insurance suggestions | Knows next steps |
| UC-7 | Newsletter preview | User navigates to Newsletter tab | Email preview mockup + frequency selector | Sees what they'd receive |
| UC-8 | No results fallback | Regulation DB returns 0 results for a query | GPT web search for industry reports + compliance guides | User always gets something |

---

## 4. Functional Requirements

### 4.1 Core Features

#### F-1: 7-Layer Carpentry Questionnaire

The questionnaire collects structured company information that allows the system to determine which legal obligations apply. Instead of asking users to search for laws themselves, the system derives relevant legal requirements from the company's structure, activities, and risk factors. Questions are specific to carpentry (Tischlerei) but the framework (7 layers, question types, flow logic) is generic for future niche expansion.

**Input:** Industry selection, company structure, business operations, employee structure, supply chain, environmental factors, insurance status.
**Output:** Legal grid with relevant EU and German regulations, status classification (fulfilled / review required / missing), risk prioritization, action recommendations.

Each layer includes embedded compliance-status checks (yes/no questions) that serve dual purpose: data collection AND instant compliance audit.

**Layer 1 — Company Basic Information (Unternehmensdaten) — Legal Identity Layer**

Purpose: Establish the legal foundation of the company.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Company name | text | yes | Or planned name |
| Industry | select | yes | Dropdown: Tischlerei / Schreinerei (future: more trades) |
| Legal form | select | yes | Einzelunternehmen, GmbH, UG, GbR, KG, OHG, other |
| "No company yet" toggle | toggle | no | Switches to planning mode — adapts all subsequent layers |
| Date of establishment | date | yes | Specific date (or planned date if no company yet) |
| Federal state (Bundesland) | select | yes | 16 German states |
| Business location(s) | text | yes | Address / number of locations |
| Commercial register entry (Handelsregister) | toggle (yes/no) | yes | — |
| Registration in crafts register (Handwerksrolle) | toggle (yes/no) | yes | — |

**AI outcome:** Determines applicability of commercial law, trade regulations, crafts regulations (HwO), and transparency register obligations depending on legal form.

**Layer 2 — Employees and Organization (Mitarbeiter) — Employment Layer**

Purpose: Identify labor law and occupational safety obligations.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Number of employees | select | yes | Ranges: 0, 1-5, 6-10, 11-20, 20+ |
| Employee types | multiselect | yes | Vollzeit, Teilzeit, Lehrlinge, Minijobber, Leiharbeiter |
| Written employment contracts in place? | toggle (yes/no) | yes | Compliance check |
| Risk assessment conducted (Gefährdungsbeurteilung)? | toggle (yes/no) | yes | Compliance check |
| Personal protective equipment provided? | toggle (yes/no) | yes | Compliance check |
| Occupational safety instructions documented? | toggle (yes/no) | yes | Compliance check |
| First aid personnel available? | toggle (yes/no) | yes | Compliance check |
| Certifications held | multiselect | no | Meisterbrief, Gesellenbrief, Staplerschein, Erste-Hilfe-Schein |

**Conditional questions:**
- If >10 employees: "Safety officer (Sicherheitsbeauftragter) assigned?" (yes/no)
- If >20 employees: "Occupational physician (Betriebsarzt) available?" (yes/no)

**AI outcome:** Mapping to German labor law (ArbSchG, ArbZG, MiLoG), occupational safety law, DGUV regulations, workplace regulations, and minimum wage documentation requirements.

**Layer 3 — Premises and Operational Safety (Werkstatt & Sicherheit) — Operational Safety Layer**

Purpose: Identify operational risks typical for workshops.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Workshop present? | toggle (yes/no) | yes | If no, skip machine-related questions |
| Owned or rented premises | select | yes | Eigentum / Miete |
| Machines in operation | multiselect | conditional | Kreissäge, CNC-Fräse, Hobelmaschine, Lackierkabine, Absauganlage |
| Dust extraction system installed? | toggle (yes/no) | conditional | Triggers TRGS 553 |
| Emergency exits marked? | toggle (yes/no) | yes | Compliance check |
| Fire extinguishers available and inspected? | toggle (yes/no) | yes | Compliance check |
| Escape route plan available? | toggle (yes/no) | yes | Compliance check |
| Storage of varnishes or solvents? | toggle (yes/no) | yes | Triggers GefStoffV |

**AI outcome:** Obligations under workplace regulations (ArbStättV), hazardous substance regulations (GefStoffV), operational safety regulations (BetrSichV), and fire safety requirements.

**Layer 4 — Products and Sales Activities (Produkte & Vertrieb) — Commercial Layer**

Purpose: Determine consumer protection and product liability obligations.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Product types | multiselect | yes | Möbel, Küchen, Fenster/Türen, Treppen, Innenausbau, Restaurierung |
| Customer types | select | yes | B2C (Privatkunden), B2B (Gewerbe), both |
| Custom-made products? | toggle (yes/no) | yes | — |
| Series production? | toggle (yes/no) | yes | Triggers additional product safety |
| Online sales? | toggle (yes/no) | yes | — |
| Own website or online shop? | toggle (yes/no) | conditional | — |
| Exports outside Germany? | toggle (yes/no) | yes | If yes → which countries |

**Conditional questions (if online sales = yes):**
- Terms and conditions (AGB) available? (yes/no) — compliance check
- Withdrawal policy (Widerrufsbelehrung) available? (yes/no) — compliance check
- Privacy policy (Datenschutzerklärung) available? (yes/no) — compliance check

**AI outcome:** Mapping to consumer protection law, distance selling regulations (Fernabsatzrecht), data protection (DSGVO), and product liability requirements (ProdHaftG, ProdSG).

**Layer 5 — Procurement and Supply Chain (Einkauf & Lieferkette) — Supply Chain Layer**

Purpose: Identify import and trade-related obligations.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Material sources | multiselect | yes | Germany, EU, non-EU |
| Supplier compliance certificates | multiselect | no | FSC/PEFC, CE-Kennzeichnung, REACH-konform |
| Uses subcontractors? | toggle (yes/no) | yes | — |
| Use of protected or regulated wood types? | toggle (yes/no) | yes | Triggers EU Timber Regulation (EUTR) |

**Conditional questions (if non-EU imports):**
- EORI number available? (yes/no)
- Imports handled via freight forwarder? (yes/no)

**AI outcome:** Determination of customs obligations, EU Timber Regulation (EUTR) applicability, REACH compliance, and potential supply chain due diligence requirements.

**Layer 6 — Environmental and Waste Management (Umwelt & Entsorgung) — Environmental Layer**

Purpose: Identify environmental compliance obligations.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Wood dust or varnish residues generated? | toggle (yes/no) | yes | — |
| Disposal via certified waste contractor? | toggle (yes/no) | yes | Compliance check |
| Regular painting or coating activities? | toggle (yes/no) | yes | Triggers VOC / BImSchG |
| VOC emissions (volatile organic compounds)? | toggle (yes/no) | conditional | — |
| Environmental permits held (BImSchG-Genehmigung)? | toggle (yes/no) | conditional | — |

**AI outcome:** Mapping to waste management law (KrWG), emissions regulations (BImSchV), hazardous material handling (ChemVerbotsV), and packaging regulations (VerpackG).

**Layer 7 — Insurance and Risk Assessment (Versicherung & Haftung) — Optional Layer**

Purpose: Extend risk analysis and identify insurance gaps. This layer is **optional** — user can skip it.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Public liability insurance (Betriebshaftpflicht)? | toggle (yes/no) | no | — |
| Machinery insurance (Maschinenversicherung)? | toggle (yes/no) | no | — |
| Disability insurance for owner (Berufsunfähigkeit)? | toggle (yes/no) | no | — |
| Product liability insurance? | toggle (yes/no) | no | — |
| BG BAU membership (Berufsgenossenschaft)? | toggle (yes/no) | no | Statutory requirement |

**AI outcome:** Insurance gap analysis, BG BAU compliance status, recommendations for additional coverage.

#### F-2: User Authentication & Accounts

Users can create accounts to persist their data across sessions.

**Requirements:**
- Supabase Auth with email + password
- Account creation offered after first scan completion (not required to start)
- Authenticated users get: scan history, persistent checkboxes, saved business profile
- Guest users can complete one scan but cannot save results

**Acceptance criteria:**
- Sign up / sign in / sign out flows
- Password reset via email
- Row-level security on all user data in Supabase
- Session persistence across browser refreshes

#### F-3: Business Profile Generation

After questionnaire completion, the system builds a structured business profile object from the answers. This profile is the input for regulation matching.

**Acceptance criteria:**
- Profile summarizes all 7 layers into a JSON object
- Profile is displayed as a human-readable summary on the results page
- Profile is stored in Supabase (authenticated users)
- Profile is reusable for newsletter personalization and risk analysis

#### F-4: Results Dashboard

Matched regulations displayed in a structured dashboard.

**Organization:**
- **By category (primary grouping):**
  - Arbeitssicherheit (Workplace Safety)
  - Arbeitsrecht (Employment Law)
  - Gewerberecht (Commercial/Trade Law)
  - Umweltrecht (Environmental Law)
  - Produktsicherheit (Product Safety)
  - Datenschutz (Data Protection)
  - Versicherungspflichten (Insurance Requirements)

- **By jurisdiction within each category (secondary grouping):**
  - EU-Verordnungen / EU-Richtlinien (EU level)
  - Bundesgesetze (German federal)
  - Landesrecht / Kommunalrecht (State/local)
  - Branchenspezifisch (Industry-specific: DGUV, BG rules)

**Per regulation card:**
- Regulation name (German + official reference)
- Jurisdiction badge (EU / Bund / Land / Branche)
- Category badge
- Risk level badge (Hoch / Mittel / Niedrig) with color coding
- Status classification: Erfüllt (fulfilled) / Prüfung nötig (review required) / Fehlend (missing)
- Short plain-language summary (2-3 sentences)
- Key requirements (3-5 bullet points)
- Potential penalty / consequence
- "Why this applies to you" — personalized explanation based on their answers
- Compliance checkbox (user can tick off)
- Link to official source

**Acceptance criteria:**
- Results are grouped by category, then by jurisdiction within each category
- Risk badges use color: red (Hoch), amber (Mittel), green (Niedrig)
- Checkboxes persist across sessions for authenticated users
- Stats bar shows: Total Regulations, High Priority count, Categories Covered, Compliance Score (% checked)

#### F-5: Scan History & Reports

Authenticated users can view, re-open, and re-run past scans.

**Requirements:**
- List of past scans with: date, business name, total regulations found, compliance score
- Click to re-open full results from a previous scan
- "Re-run scan" button that pre-fills questionnaire with previous answers
- Basic export: print/PDF of results page

**Acceptance criteria:**
- Scans stored in Supabase with user association
- Scan list sorted by date (newest first)
- Maximum storage: last 50 scans per user

#### F-6: Risk Analysis Tab (In Preparation — Phase 2)

GPT-5.2 analyzes each matched regulation against the user's business profile and identifies specific compliance gaps, deadline requirements, and penalty exposure.

**Phase 1 (MVP):** Mockup tab showing pre-computed severity data from the regulation database. "In Preparation" badge. Data comes from the regulation `riskLevel` and `potentialPenalty` fields — no AI needed.

**Phase 2 (AI-Powered):**
- GPT-5.2 receives: user's business profile + matched regulations + questionnaire compliance-check answers
- GPT analyzes: specific gaps between what's required and what the user has
- Output: severity table (Hoch/Mittel/Niedrig), compliance gap description, deadline, potential penalty per regulation
- Summary banner: "X of Y regulations are high risk"
- Powered by OpenAI API (model: gpt-5.2, key stored in .env.local)

#### F-7: Actionable Recommendations Tab (In Preparation — Phase 2)

Prioritized action list generated from risk analysis. Bundled with Risk Analysis — same GPT call.

**Phase 1 (MVP):** Mockup tab with pre-computed carpentry-specific recommendations derived from matched regulations. "In Preparation" badge.

**Phase 2 (AI-Powered):**
- GPT-5.2 generates from risk analysis: prioritized compliance steps, recommended insurance types, suggested timeline, where to find help
- Checklist sorted by urgency: Sofort / Bald / Geplant
- Insurance section: recommended types + broker suggestions
- Certification section: required certifications with training provider links

#### F-8: Newsletter / Regulation Digest Tab (In Preparation — Phase 2)

Personalized email digest showing regulation updates relevant to the user's specific profile.

**Phase 1 (MVP):** Mockup preview tab populated with user's actual matched regulations (not generic). Shows what the digest would look like. Frequency toggle (Wöchentlich/Monatlich). "In Preparation" badge. No emails sent.

**Phase 2 (Live):**
- Admin triggers digest generation → system checks for regulation updates → matches against opted-in user profiles → generates personalized digest via GPT-5.2 → sends via Resend email API
- Double opt-in consent required
- Sources: DGUV rule changes, BG BAU announcements, HWK updates, federal law changes
- Requires client's own domain for email sending
- Supabase stores: subscriber preferences, opt-in status, digest history

#### F-9: Company Analysis Fallback (Phase 2)

When the regulation database returns few or no results for a specific query, the system provides alternative useful content via AI.

**Phase 1 (MVP):** Hardcoded fallback content for known edge cases in carpentry (e.g., Restaurierung → Denkmalschutz hint).

**Phase 2 (AI-Powered):**
- Triggered when a category has 0 matched regulations
- GPT-5.2 with web search finds: industry reports, compliance guides, expert opinions
- Synthesized into: "Betriebe wie Ihrer unterliegen typischerweise X, Y, Z..."
- Clearly labeled as "additional research" vs. confirmed regulations
- Not a separate tab — behavior on the results page

#### F-10: Internationalization (i18n)

Bilingual support: German (default) + English.

**Requirements:**
- Language toggle in the UI (header or settings)
- All UI strings in translation files (next-intl or similar)
- German is default on first visit
- Language preference stored in user profile (authenticated) or localStorage (guest)
- Regulation names show both German name and official reference regardless of language

### 4.2 Feature Priority (MoSCoW)

#### Must Have (MVP — Phase 1)
- [ ] 7-layer carpentry questionnaire with all fields from Raphael's grid (including embedded compliance checks and conditional logic)
- [ ] Business profile generation from questionnaire answers
- [ ] Results dashboard with category + jurisdiction grouping
- [ ] Compliance checkboxes on each regulation
- [ ] Risk badges (Hoch/Mittel/Niedrig) per regulation
- [ ] Status classification per regulation (Erfüllt / Prüfung nötig / Fehlend)
- [ ] Stats bar (Total, High Priority, Categories, Compliance Score)
- [ ] "No company yet" toggle with adapted flow
- [ ] Sidebar navigation matching new structure
- [ ] User authentication (Supabase Auth — email/password)
- [ ] Scan history — view, re-open, re-run past scans
- [ ] Persistent compliance checkboxes (across sessions, requires auth)
- [ ] Risk Analysis mockup tab with pre-computed data + "In Preparation" badge
- [ ] Newsletter mockup tab with user's matched regulations + "In Preparation" badge
- [ ] Recommendations mockup tab with pre-computed data + "In Preparation" badge
- [ ] Bilingual UI: German (default) + English
- [ ] Mobile detection (desktop-only message)
- [ ] Legal disclaimer on results page

#### Should Have (MVP)
- [ ] Company analysis fallback — hardcoded edge case content
- [ ] Animated processing screen with carpentry-relevant steps
- [ ] Settings tab with language preference + account management
- [ ] Export/print results (basic PDF/print)
- [ ] Progress indicator showing questionnaire completion (Layer X von 7)

#### Could Have (MVP)
- [ ] "Save & continue later" — resume incomplete questionnaire
- [ ] Regulation search/filter within results
- [ ] Impressum + Datenschutzerklärung pages

#### Won't Have (MVP — moves to Phase 2 or Phase 3)

**Phase 2 (AI + Live integrations):**
- GPT-5.2 powered Risk Analysis (real-time gap analysis)
- GPT-5.2 powered Actionable Recommendations (dynamic action lists)
- GPT-5.2 powered Company Analysis Fallback (web search for gaps)
- Real email delivery via Resend (newsletter digest)
- Live regulation data sources (gesetze-im-internet.de, DGUV.de)

**Phase 3 (Scale):**
- AI Learning Database (auto-suggest industry from business name, e.g., "Vladimir Woodcrafts" → Tischlerei)
- Regulations Library (browse/search all regulations by industry)
- Multi-niche expansion (electricians, plumbers, other Handwerk trades)
- Industry selector entry point
- Payment / subscription system

**Not planned:**
- EUR-Lex SPARQL integration (not needed — German law sources sufficient)
- SAP connector (dropped from scope)

---

## 5. Non-Functional Requirements

### 5.1 Performance
- Questionnaire transitions: <200ms (Framer Motion)
- Processing animation: 3-5 seconds (simulated in MVP, real in Phase 2)
- Results render: <500ms after processing completes
- Initial page load: <2s on 4G connection

### 5.2 Security
- Supabase Auth with email + password
- Row-level security (RLS) on all user data
- API keys stored in .env.local (never committed)
- OpenAI API key: server-side only (Next.js API routes / server actions)
- No sensitive data collection in questionnaire (no financials, no personal IDs)
- GDPR-compliant: cookie consent, data deletion on request

### 5.3 Scalability
- Questionnaire framework is generic: 7 layers with configurable questions per niche
- Regulation database is structured for multi-niche: each regulation has `appliesTo` conditions
- Adding a new trade = new question set + new regulation mappings, not new code
- Data layer designed for migration from hardcoded → Supabase → live APIs

### 5.4 Accessibility
- Keyboard navigation through questionnaire
- Sufficient color contrast (WCAG AA minimum)
- Screen reader labels on form inputs
- Focus management on screen transitions

### 5.5 Compatibility
- Desktop browsers: Chrome, Firefox, Safari, Edge (latest 2 versions)
- Mobile: display "desktop-only" message (not optimized for mobile in MVP)
- Minimum viewport: 1024px width

---

## 6. Technical Requirements

### 6.1 System Architecture

**MVP (Phase 1):**
```
┌──────────────────────────────────────────┐
│          Next.js 16 (App Router)         │
│                                          │
│  ┌────────────┐  ┌───────────────────┐   │
│  │   Pages     │  │   Components      │   │
│  │  (app/)     │  │  (components/)    │   │
│  └────────────┘  └───────────────────┘   │
│                                          │
│  ┌───────────────────────────────────┐   │
│  │      Data Layer (data/)           │   │
│  │  - Questionnaire configs          │   │
│  │  - Regulation database (mock)     │   │
│  │  - Scoring engine                 │   │
│  │  - Niche: carpentry              │   │
│  └───────────────────────────────────┘   │
│                                          │
│  ┌───────────────────────────────────┐   │
│  │      i18n (translations/)         │   │
│  │  - de.json (German)               │   │
│  │  - en.json (English)              │   │
│  └───────────────────────────────────┘   │
│                                          │
│  Vercel deploy                           │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────┐
│       Supabase           │
│  - Auth (email/password) │
│  - User profiles         │
│  - Scan history          │
│  - Checkbox state        │
└──────────────────────────┘
```

**Phase 2 (AI + Live):**
```
┌──────────────┐     ┌──────────────┐     ┌───────────────────┐
│   Next.js    │────▶│  Supabase    │     │  OpenAI API       │
│   Frontend   │     │  - Auth      │     │  - GPT-5.2        │
│              │◀────│  - DB        │     │  - Risk analysis   │
│              │     │  - Storage   │     │  - Recommendations │
│              │     └──────────────┘     │  - Web search      │
│              │                          └───────────────────┘
│              │     ┌──────────────┐
│              │────▶│   Resend     │     ┌───────────────────┐
│              │     │   (Email)    │     │  German Law APIs   │
│              │     └──────────────┘     │  - gesetze-im-     │
│              │                          │    internet.de     │
│              │─────────────────────────▶│  - DGUV.de         │
│              │                          └───────────────────┘
└──────────────┘
```

### 6.2 Technology Stack

| Layer | Technology | Version | Phase |
|-------|-----------|---------|-------|
| Framework | Next.js | 16.x | MVP |
| Language | TypeScript | 5.x | MVP |
| UI | React | 19.x | MVP |
| Styling | Tailwind CSS | 4.x | MVP |
| Animation | Framer Motion | 12.x | MVP |
| Icons | Lucide React | latest | MVP |
| i18n | next-intl (or similar) | latest | MVP |
| Auth | Supabase Auth | latest | MVP |
| Database | Supabase PostgreSQL | latest | MVP |
| Deployment | Vercel | — | MVP |
| AI | OpenAI GPT-5.2 | — | Phase 2 |
| Email | Resend | — | Phase 2 |

### 6.3 API Requirements

**MVP:**
| API | Purpose | Format |
|-----|---------|--------|
| Supabase | Auth, user profiles, scan history, checkbox state | REST |

**Phase 2:**
| API | Purpose | Format |
|-----|---------|--------|
| OpenAI (GPT-5.2) | Risk analysis, recommendations, fallback search | REST API |
| Resend | Transactional email for newsletter digest | REST API |
| gesetze-im-internet.de | German federal laws (future live data) | XML/HTML |
| DGUV.de | Occupational safety rules | HTML |

**Not used:**
- EUR-Lex SPARQL (dropped — German law sources sufficient)

### 6.4 Data Requirements

**Regulation data model:**
```typescript
interface Regulation {
  id: string;
  name: string;                    // e.g., "Arbeitsstättenverordnung (ArbStättV)"
  officialReference: string;       // e.g., "ArbStättV §3-§8"
  jurisdiction: "eu" | "bund" | "land" | "branche";
  category: RegulationCategory;
  summary: string;                 // 2-3 sentences, plain language
  keyRequirements: string[];       // 3-5 bullet points
  potentialPenalty: string;        // e.g., "Bußgeld bis 5.000€"
  riskLevel: "hoch" | "mittel" | "niedrig";
  sourceUrl: string;               // Official source link
  appliesWhen: AppliesCondition[]; // Conditions from questionnaire answers
  niche: string;                   // "carpentry" | "electrician" | etc.
}

type RegulationCategory =
  | "arbeitssicherheit"     // Workplace Safety
  | "arbeitsrecht"          // Employment Law
  | "gewerberecht"          // Commercial/Trade Law
  | "umweltrecht"           // Environmental Law
  | "produktsicherheit"     // Product Safety
  | "datenschutz"           // Data Protection
  | "versicherungspflichten"; // Insurance Requirements

interface AppliesCondition {
  field: string;          // Questionnaire field path
  operator: "eq" | "in" | "gt" | "exists";
  value: unknown;
}
```

**Questionnaire config model:**
```typescript
interface QuestionnaireLayer {
  id: number;             // 1-7
  title: string;          // Display title (translated)
  subtitle: string;       // Helper text (translated)
  purpose: string;        // AI outcome description
  optional: boolean;      // Layer 7 is optional
  fields: QuestionField[];
  conditionalFields?: ConditionalField[];
}

interface QuestionField {
  id: string;
  type: "text" | "date" | "select" | "multiselect" | "toggle" | "number";
  label: string;          // Translated label
  options?: { value: string; label: string }[];
  required: boolean;
  isComplianceCheck: boolean;  // Dual-purpose: data + compliance status
  triggersRegulations?: string[];
}

interface ConditionalField {
  field: QuestionField;
  showWhen: { field: string; operator: string; value: unknown };
}
```

**Supabase schema (MVP):**
```sql
-- Users (managed by Supabase Auth)

-- User profiles
profiles (
  id uuid references auth.users,
  language text default 'de',  -- 'de' | 'en'
  created_at timestamp
)

-- Scans
scans (
  id uuid primary key,
  user_id uuid references auth.users,
  business_profile jsonb,       -- Full questionnaire answers
  matched_regulations jsonb,    -- Matched regulation IDs + scores
  compliance_score numeric,
  created_at timestamp
)

-- Compliance checkboxes
compliance_checks (
  id uuid primary key,
  scan_id uuid references scans,
  regulation_id text,
  checked boolean default false,
  checked_at timestamp
)
```

**Sample regulation count for carpentry MVP:**
- Arbeitssicherheit: ~8-10 (ArbSchG, ArbStättV, BetrSichV, DGUV Vorschrift 1, DGUV Regel 109-606, TRGS 553, GefStoffV, PSA-BV)
- Arbeitsrecht: ~5-6 (MiLoG, ArbZG, MuSchG, JArbSchG, BBiG, NachwG)
- Gewerberecht: ~4-5 (HwO, GewO, Handwerksordnung Anlage A, Meisterpflicht)
- Umweltrecht: ~4-5 (BImSchG, KrWG, VerpackG, ChemVerbotsV)
- Produktsicherheit: ~3-4 (ProdSG, ProdHaftG, CE-Kennzeichnung, DIN-Normen)
- Datenschutz: ~2-3 (DSGVO, BDSG, TTDSG)
- Versicherungspflichten: ~3-4 (BG BAU Pflichtmitgliedschaft, Betriebshaftpflicht, Berufshaftpflicht)

**Total: ~30-40 regulations for carpentry niche MVP**

### 6.5 Integration Requirements

**MVP:**
| Integration | Priority | Notes |
|-------------|----------|-------|
| Supabase Auth | Must Have | Email/password, user profiles |
| Supabase DB | Must Have | Scan history, checkbox state, user preferences |

**Phase 2:**
| Integration | Priority | Notes |
|-------------|----------|-------|
| OpenAI GPT-5.2 | High | Risk analysis, recommendations, fallback search |
| Resend | Medium | Newsletter digest delivery, requires client's own domain |
| gesetze-im-internet.de | Medium | German federal law lookup |
| DGUV.de | Medium | DGUV Regel 109-606 + related woodworking rules |

### 6.6 Environment Variables

```bash
# MVP
NEXT_PUBLIC_SUPABASE_URL=<supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<supabase-service-role-key>

# Phase 2
OPENAI_API_KEY=<stored-in-.env.local>
OPENAI_MODEL=gpt-5.2
RESEND_API_KEY=<resend-api-key>
```

---

## 7. UI/UX Requirements

### 7.1 Design Principles

1. **Friendly, not legal.** Every label, description, and result is written in plain language that a Tischlermeister would use. No "Verordnung (EU) 2016/679" without "Datenschutz-Grundverordnung (DSGVO)" next to it.

2. **Progressive disclosure.** 7 layers sounds like a lot — each layer is one focused screen with 4-8 fields max. Progress bar shows advancement. User never feels overwhelmed.

3. **Investor-grade polish.** Smooth animations, professional typography, consistent spacing. "In Preparation" badges look intentional (roadmap signal), not unfinished.

4. **Category-first, jurisdiction-second.** Users think "what about safety?" not "what about EU law?" Categories they understand (Sicherheit, Mitarbeiter, Umwelt) come first. Jurisdiction (EU/Bund/Land) is a secondary grouping within each category.

5. **Bilingual.** German as default. English available via language toggle. All UI strings come from translation files. Regulation names always show German name + official reference.

6. **Compliance checks embedded.** Yes/no questions in the questionnaire double as compliance status indicators. When the user says "Risk assessment conducted? No" — the system already knows there's a gap before it even runs the matching.

### 7.2 Key Screens/Flows

**Screen 1 — Login / Sign Up**
- Email + password authentication
- "Continue as guest" option (limited: 1 scan, no persistence)
- Language toggle visible

**Screen 2 — Dashboard**
- Welcome message + "Compliance-Scan starten" CTA
- Quick stats: Letzter Scan, Vorschriften gefunden, Offene Maßnahmen
- Recent scans list (if any)
- Product name + tagline

**Screens 3-9 — Questionnaire (7 layers)**
- One layer per screen
- Progress bar (Schritt 1 von 7)
- "Zurück" / "Weiter" navigation
- Layer 7 shows "Überspringen" (Skip) option
- "No company yet" toggle on Layer 1 adapts subsequent layers
- Smooth slide transitions between layers
- Compliance-check questions visually distinct (e.g., green check / red X indicators)

**Screen 10 — Processing**
- Animated progress with carpentry-relevant steps:
  1. "Unternehmensprofil wird erstellt..."
  2. "Durchsuche EU-Vorschriften..."
  3. "Durchsuche Bundesgesetze..."
  4. "Durchsuche Landesrecht & Branchenregeln..."
  5. "Erstelle Compliance-Übersicht..."

**Screen 11 — Results Dashboard**
- Stats bar at top
- Business profile summary
- Regulations grouped by category → jurisdiction
- Each card: name, badges, status, summary, requirements, penalty, checkbox
- Filter/search within results (Should Have)
- Legal disclaimer: "Dies ist keine Rechtsberatung."

**Screen 12 — Scan History**
- List of past scans with date, business name, regulations found, compliance score
- Click to re-open, button to re-run

**Screen 13 — Risk Analysis (In Preparation)**
- Severity table with pre-computed data from matched regulations
- "In Preparation" badge

**Screen 14 — Newsletter (In Preparation)**
- Email preview populated with user's matched regulations
- Frequency toggle
- "In Preparation" badge

**Screen 15 — Recommendations (In Preparation)**
- Prioritized action checklist from matched regulations
- Insurance + certification sections
- "In Preparation" badge

**Screen 16 — Settings**
- Language preference (Deutsch / English)
- Account management (email, password change)
- Data export / account deletion (GDPR)

**Sidebar Navigation:**
```
COMPLIANCE
  Dashboard
  Neuer Scan
  Scan-Verlauf

ANALYSE
  Risikoanalyse          [In Vorbereitung]
  Empfehlungen           [In Vorbereitung]
  Newsletter             [In Vorbereitung]

SYSTEM
  Einstellungen
```

### 7.3 Wireframe References

No formal wireframes — the existing prototype UI patterns (sidebar layout, card-based results, "In Preparation" screen template) serve as the design reference. The rebuild reuses the visual language but replaces all content and data structures.

---

## 8. Dependencies and Constraints

### 8.1 Technical Dependencies

| Dependency | Status | Risk |
|------------|--------|------|
| Next.js 16 + React 19 | Already in project | None |
| Framer Motion | Already in project | None |
| Vercel deployment | Already configured | None |
| Supabase | **Needs setup** | Low — free tier sufficient for MVP |
| Domain (complyradar.de/eu) | **Not confirmed purchased** | Medium — need DNS setup |
| OpenAI API key | **Available** (.env.local) | None for Phase 2 |

### 8.2 Business Constraints

- **Single niche focus:** MVP is carpentry ONLY. No generic fallback. Every question and regulation is carpentry-specific.
- **Bilingual:** German default + English. Not optional — both languages ship in MVP.
- **Partner alignment:** Fabian is aligned on ComplyRadar branding but may have additional requirements — unknown scope risk.
- **Budget:** V1 was $540, V2 was $810. Scope has grown significantly (auth, i18n, scan history). Pricing needs discussion.

### 8.3 Regulatory Requirements

The product itself must comply with:
- DSGVO (GDPR) — privacy policy, cookie consent, right to data deletion
- Impressumspflicht — legal notice page required for German-facing website
- No legal advice disclaimer — ComplyRadar provides information, not legal counsel. Disclaimer required on results page: "Dies ist keine Rechtsberatung. Konsultieren Sie einen Fachanwalt."

---

## 9. Timeline and Milestones

### 9.1 Phase 1: MVP

**Deliverable:** Functional product with auth, bilingual UI, 7-layer questionnaire, results dashboard, scan history, and mockup tabs for future AI features.

| Milestone | Description |
|-----------|-------------|
| M1 | Project setup: Supabase, i18n, component architecture |
| M2 | Authentication: sign up, sign in, guest mode |
| M3 | 7-layer questionnaire with all carpentry fields + conditional logic |
| M4 | Regulation database: 30-40 German carpentry regulations with metadata |
| M5 | Results dashboard with category + jurisdiction grouping + checkboxes |
| M6 | Scan history: save, view, re-run past scans |
| M7 | Mockup tabs: Risk Analysis, Newsletter, Recommendations (pre-computed data) |
| M8 | Bilingual UI: German + English translation files |
| M9 | Polish, animations, legal pages, investor-ready state |

### 9.2 Phase 2: AI + Live Integrations

**Deliverable:** GPT-5.2 powered analysis, real email delivery, live regulation data.

| Milestone | Description |
|-----------|-------------|
| M10 | OpenAI integration: GPT-5.2 for risk analysis + recommendations |
| M11 | Company analysis fallback: GPT web search for gaps |
| M12 | Resend email integration for newsletter digest |
| M13 | Live regulation data sources (gesetze-im-internet.de, DGUV) |
| M14 | Domain migration (complyradar.de) |

### 9.3 Phase 3: Scale

**Deliverable:** Multi-niche expansion, AI learning, regulation library.

| Milestone | Description |
|-----------|-------------|
| M15 | AI Learning Database — auto-suggest industry from business name |
| M16 | Regulations Library — browse/search all regulations |
| M17 | Second niche: Elektriker (electricians) |
| M18 | Industry selector entry point |
| M19 | Payment / subscription system |

---

## 10. Risks and Mitigation

### 10.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Regulation data accuracy | High | High | MVP uses curated mock data with real regulation names/references. Phase 2 validates against official sources. Disclaimer on every page. |
| Monolith complexity | Medium | Medium | Restructure page.tsx into components before adding new features. |
| Questionnaire too long (7 layers) | Medium | Medium | Progressive disclosure, progress bar, optional Layer 7, save & continue. |
| Supabase free tier limits | Low | Medium | Monitor usage. Upgrade to Pro if needed. |
| i18n maintenance burden | Medium | Low | Translation files are simple JSON. German is source of truth. |

### 10.2 Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Scope creep from partner (Fabian) | Medium | Medium | PRD locks scope. Changes go through version control. |
| Domain not purchased | Medium | Low | Can demo on Vercel URL. Domain is nice-to-have for MVP. |
| Legal liability from incorrect compliance info | Medium | High | Prominent disclaimer: "Keine Rechtsberatung." Information only. |
| Pricing misalignment with expanded scope | High | Medium | Discuss before build starts. |

### 10.3 Mitigation Strategies

1. **Disclaimer-first approach:** Every results page includes "Dies ist keine Rechtsberatung. Konsultieren Sie einen Fachanwalt." prominently.
2. **Modular data architecture:** Regulation database is config-driven, not hardcoded in components. Adding/fixing regulations = editing data files, not code.
3. **Investor framing:** "In Preparation" features are explicitly labeled. No fake functionality that could misrepresent product state.
4. **Incremental delivery:** Each milestone is independently demoable. No big-bang delivery.

---

## 11. Appendix

### 11.1 Glossary

| Term | Definition |
|------|-----------|
| Handwerk | German skilled trades (carpentry, electrical, plumbing, etc.) |
| Tischlerei / Schreinerei | Carpentry workshop (regional terms, same trade) |
| Meisterbrief | Master craftsman certificate — required to open a Handwerk business in Germany |
| Gesellenbrief | Journeyman certificate |
| Handwerkskammer (HWK) | Chamber of Crafts — mandatory registration for Handwerk businesses |
| Handwerksrolle | Crafts register — official registry of Handwerk businesses |
| BG BAU | Berufsgenossenschaft der Bauwirtschaft — statutory accident insurance for construction/carpentry |
| DGUV | Deutsche Gesetzliche Unfallversicherung — umbrella org for occupational safety rules |
| DGUV Regel 109-606 | Specific safety standard for woodworking |
| TRGS 553 | Technical Rules for Hazardous Substances — wood dust exposure |
| Gefährdungsbeurteilung | Mandatory workplace risk assessment under ArbSchG |
| BImSchG | Bundes-Immissionsschutzgesetz — Federal Emissions Control Act |
| ArbSchG | Arbeitsschutzgesetz — Occupational Safety Act |
| HwO | Handwerksordnung — Crafts Code |
| EUTR | EU Timber Regulation — controls timber imports |
| Landesrecht | State/regional law (varies by Bundesland) |
| EORI | Economic Operators Registration and Identification number (customs) |

### 11.2 References

- Current prototype: regscope-nine.vercel.app
- GitHub repo: github.com/vilin1927/regscope
- OpenAI GPT-5.2 docs: developers.openai.com/api/docs/models/gpt-5.2
- gesetze-im-internet.de (German federal laws)
- DGUV.de (occupational safety)
- DGUV Regel 109-606 (woodworking safety)
- Supabase docs: supabase.com/docs
- Resend docs: resend.com/docs

### 11.3 Add-on Pricing Reference (Original)

For reference — original pricing structure before scope expansion:

| Add-on | Original Price | MVP Status | Phase 2 Status |
|--------|---------------|------------|----------------|
| Core MVP (questionnaire + results) | $540 | Rebuilding with 7-layer carpentry focus | — |
| Legal Risk Analysis | $60 | Mockup (pre-computed from data) | GPT-5.2 powered |
| Regulation Newsletter | $150 | Mockup preview (user's data) | Resend + GPT-5.2 |
| Company Analysis Fallback | $60 | Hardcoded edge cases | GPT-5.2 web search |
| Actionable Recommendations | Free (bundled with Risk Analysis) | Mockup (pre-computed) | GPT-5.2 powered |
| Full V2 package | $810 | — | — |

**Note:** Scope has grown significantly (auth, i18n, scan history, 7-layer questionnaire vs original 3-step). Pricing needs re-discussion.

### 11.4 Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-12 | Initial PRD based on full scope discussion |
| 2.0 | 2026-02-12 | Major update: merged Raphael's detailed carpentry grid, added auth + scan history to MVP, added bilingual (DE+EN), moved Risk Analysis/Newsletter/Recommendations to Phase 2 (GPT-powered), dropped EUR-Lex + SAP, added OpenAI GPT-5.2 requirement, added Supabase schema, renamed project to ComplyRadar |
