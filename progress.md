# ComplyRadar — Progress Log

> **Last updated:** 2026-03-21
> **Current state:** Phase 2 M1 — COMPLETE, deployed on Raphael's Hetzner VPS, all tests passing

---

## Phase 2 M1 — ACTIVE

**Accepted:** 2026-03-18 (Raphael funded M1 on Upwork)
**Feature:** Dynamic Questionnaire + Handelsregister — $450
**Deadline:** 2026-03-22 (Saturday EOD)
**Demo:** 2026-03-24 at 14:00 Berlin time (Raphael's agency meeting)
**VPS:** Using Peter's GlobalHair VPS (187.77.93.207) for microservice — Option B (Vercel stays for Next.js)

### Session 2026-03-21 — Epic 4 Implementation

**Completed:**
- E4.1-E4.4: Full scan flow wired with industry context
  - `useProcessing` now passes `companyContext` to scan API
  - `ScanProvider.CompanyContext` extended with `industryCode` + `industryLabel`
  - `ComplyRadarApp` stores classification from questionnaire generation into company context
  - Scan API route rewritten: dual-mode (static carpentry + dynamic any-industry)
  - Dynamic mode: AI identifies 15-30 real German regulations for any industry
  - Static mode: kept for carpentry (backward compatible)
  - TypeScript builds clean
- Vercel env vars set: `HANDELSREGISTER_API_URL` + `HANDELSREGISTER_API_KEY` ✅
- VPS microservice health confirmed ✅

**Also completed (2026-03-21 continued):**
- Supabase migration applied ✅ (industry_templates table)
- PRs #7-#11 merged (Epic 4 + 4 hotfixes)
- Hotfixes: token limits (questionnaire 3000→5000, scan 4000→8000), dynamic detection, retry context
- Full migration to Raphael's Hetzner VPS (46.225.92.189):
  - Next.js app via PM2 + nginx
  - Handelsregister microservice via systemd + gunicorn
  - SSL via certbot (auto-renew, expires 2026-06-19)
  - DNS: smart-lex.de → 46.225.92.189 (United Domains)
  - Vercel no longer needed

**Also completed (2026-03-21 evening):**
- E4.5: End-to-end test on Hetzner — PASSED (Orgonic Art → 20 regulations)
- E4.7: Error handling — 404 search fix, retry with companyContext, timeout 90s
- Admin Templates viewer (F-100-E5) — shows cached industry questionnaires
- Toggle shrink fix for desktop
- PRs #7-#15 all merged

**Verified on production (all passing):**
- SSL/HTTPS ✅
- Handelsregister microservice ✅
- Company search → results ✅
- AI questionnaire generation (fresh + cached) ✅
- Dynamic scan → results (20 regulations) ✅
- Admin templates page ✅
- Static carpentry fallback (skip search) ✅

**Remaining (non-blocking):**
- Clean up GlobalHair VPS (remove old microservice)
- Remove Vercel project (optional)
- E4.8: E2E test with 3+ more industries (bakery tested, need 2 more)
- Mobile responsive spot-check on new screens

**Decision:** Full stack on Raphael's Hetzner VPS — client owns everything. Vercel dropped.

---

### Handelsregister API — Rate Limits & Scaling

**Current state:**
- Each company search makes 1 API call to handelsregister.de (government website)
- Rate limit: **60 requests/hour** (enforced by government site + our microservice)
- In-memory rate limiter exists in microservice (per IP, 60/hour)
- **No tracking dashboard** — we don't currently monitor how many calls are used
- No caching of search results — every search hits handelsregister.de live

**Is 60/hour enough?**
- For beta (8 agencies, ~20-50 users/day): YES, plenty
- Each user typically searches 1-2 times per session
- Problem only at 100+ concurrent users searching simultaneously

**Future scaling solution — Search Result Caching (not built yet, ~2h work):**
```
User A searches "Bäckerei" → hits handelsregister.de → saves to Supabase
User B searches "Bäckerei" → hits Supabase cache → instant, 0 API calls
```
- One Supabase table: `company_search_cache` (search_term, results, cached_at)
- TTL: 30 days (company data rarely changes)
- After months: thousands of companies cached, almost zero live API calls
- NO IP rotation or proxy needed — just a database cache

**NOT needed for scaling:**
- IP proxy rotation (only for bulk scraping all 5M companies — not our use case)
- Multiple API keys (handelsregister.de doesn't use API keys)
- Multiple VPS instances (one VPS handles 60/hour fine)

**Nice-to-have for monitoring (future):**
- API call counter (daily/hourly usage)
- Admin dashboard showing remaining quota
- Alert when approaching 60/hour limit

### API Call Breakdown Per User Flow

| Step | What happens | API calls |
|------|-------------|-----------|
| User types in search bar | Search Handelsregister | **1 call to handelsregister.de** per search (debounced 500ms) |
| User clicks a company result | Just selects from already-loaded results | **0 calls** (data already fetched) |
| User clicks "Continue" | AI classifies industry + generates/loads questionnaire | **1-2 calls to OpenAI** (0 if industry cached in Supabase) |
| User fills questionnaire + "Analyze" | AI scans for regulations | **1 call to OpenAI** |

**Key:** Clicking a company from the list does NOT make another Handelsregister call. The Gegenstand is already in the search results.

### Questionnaire Caching (industry_templates)

- First time an industry is scanned: AI generates questions (~15-30 sec), saves to `industry_templates` table in Supabase
- Second time same industry: loads from database (<2 sec, no OpenAI call)
- **How to tell from UI:** If "Fragebogen wird erstellt..." loading is fast (<2 sec) = cached. If 15-30 sec = freshly generated.
- Cache key: `industry_code` (e.g. HANDWERK_BAECKEREI, KUNST_KULTUR, IT_DIENSTLEISTUNG)
- Two different bakeries get the SAME cached questionnaire (same industry code)
- Check cache: Supabase → Table Editor → `industry_templates` (shows industry_code, usage_count)

**Final Milestones Sent:**

M1: Dynamic Questionnaire + Handelsregister — $450 (5-7 days)
M2: Stripe + Paywall — $170 (4 days)
M3: Referral System + Expert Connection — $135 (3 days)
M4: Expert Improvements — $80 (2 days)

**Questions pending from Raphael:**
- M1: Hetzner account (or other German VPS)
- M2: Stripe account? Confirm €190/6mo? Free trial?
- M3: Reward structure for consultants?
- M4: Expert tags by topic or industry?

**Future (excluded from proposal):**
- Expert Analytics (click tracking) — evaluate after M1-M4 live

---

## Project Snapshot

| Area | Status |
|------|--------|
| Core questionnaire (7 layers) | Done |
| AI scan (GPT-5.2 via OpenAI) | Done |
| Results dashboard | Done |
| Auth (Supabase) | Done |
| Scan history | Done |
| i18n (DE/EN) | Done |
| Risk Analysis addon | Done |
| Recommendations addon | Done |
| Newsletter addon (Resend) | Done |
| Admin panel | Done |
| Freemium/trial system | Done |
| Expert profiles | Done |
| Mobile responsive | Done |
| Legal pages (Impressum, Datenschutz) | Done |
| URL routing (shallow) | Done |

## Deployment

- **Platform:** Vercel (auto-deploy from `main`)
- **Region:** `fra1` (Frankfurt)
- **Live URL:** https://regscope-nine.vercel.app
- **Repo:** https://github.com/vilin1927/regscope
- **Branch strategy:** Feature branches + PRs (never commit directly to `main`)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router) |
| Language | TypeScript 5.x |
| UI | React 19, Tailwind CSS 4, Framer Motion 12, Lucide React |
| i18n | next-intl |
| Auth & DB | Supabase (Auth + PostgreSQL) |
| AI | OpenAI API (GPT-5.2) |
| Email | Resend + React Email |
| Deployment | Vercel (free tier, fra1 region) |

## Database Tables (Supabase)

| Table | Migration File |
|-------|---------------|
| profiles | supabase/migration.sql |
| scans | supabase/migration.sql |
| compliance_checks | supabase/migration.sql |
| risk_reports | supabase/migration-addons.sql |
| recommendations | supabase/migration-addons.sql |
| newsletter_preferences | supabase/migration-addons.sql |

All tables have RLS enabled with user-scoped policies.

## Environment Variables Required

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
OPENAI_API_KEY
OPENAI_MODEL (default: gpt-5.2)
RESEND_API_KEY
RESEND_DOMAIN (default: complyradar.de)
ADMIN_EMAIL (comma-separated for multi-admin)
ADMIN_API_KEY
SUPABASE_SERVICE_ROLE_KEY
```

## Known Issues / Limitations

- Vercel free tier has 10s default function limit; risk analysis/recommendations routes configured for 60s via vercel.json
- In-memory rate limiter resets on cold starts (acceptable for current scale; Redis/Upstash for production scale)
- Middleware 504 issue was fixed by removing Supabase auth from middleware (commit f3b8282)

## Recent Git History (latest first)

- `f3b8282` Remove Supabase auth from middleware to fix persistent 504 timeout
- `d88d9fe` Fix 504 MIDDLEWARE_INVOCATION_TIMEOUT on production
- `3e6c03a` Add multi-admin support via comma-separated ADMIN_EMAIL
- `380f041` Fix sidebar user section disappearing on long pages
- `da74993` Add admin trial controls and server-side subscription sync
- `893b754` Expert profiles, scroll indicators, plan badge, upgrade animations
- `1e891b1` Compliance score widget, expert contact button, freemium paywall
- `5c4b54a` Mobile responsive design, toggle colors, establishment date fix
- `c89113c` Translate all English error messages and strings to German

## What's Next (Planned)

1. **Multi-niche expansion** (F-100) — Framework for adding new German trades beyond carpentry
2. **Stripe payment integration** (F-101) — Replace trial-based freemium
3. **Automated regulation updates** (F-102) — Monitor legal databases, notify affected users

---

## Session Log

### 2026-03-16 — Client Call Analysis & Phase 2 Planning

**Call with Raphael & Fabian (2026-03-15, ~29 min)**

Client has 8 partner agencies waiting. Need to upgrade MVP to be sellable across all industries.

**Requested Features (priority order):**

| # | Feature | Effort | Price Range |
|---|---------|--------|-------------|
| 1 | Dynamic Questionnaire + Handelsregister | ~40% of MVP | $350-400 |
| 2 | Stripe + Paywall | ~15-20% | $150-200 |
| 3 | Referral System | ~15% | $140-180 |
| 4 | Expert Improvements (tags, matching) | ~5% | $50-80 |

**Total estimate: $690-860** (vs MVP was $960)

**Buying probability analysis:**
- Feature 1 alone: 85% (they need this to sell)
- Features 1+2: 70%
- Full package: 50-55%
- Price negotiation: 90% certain

**Client signals:**
- Positive: "super happy with what you've done", 8 agencies waiting, specific pricing (€190/6mo)
- Cautious: "can't hire full-time yet", want "agile releases" (= control costs)

---

**Feature 1 Technical Discussion:**

User's insight: Free text "occupation" field = messy data. Better approach:

1. User enters **HRB code** directly, OR
2. User enters **website** → system scrapes imprint for HRB, OR
3. User searches **Handelsregister** manually and enters code

Once HRB is obtained → lookup "Gegenstand" (company objective) → standardized industry → generate appropriate questions.

Key platform: **Handelsregister** (German trade registry)
- Every German company has HRB number
- Contains mandatory "Gegenstand" (objective/industry) field
- Public data, can be looked up via northdata.de or official registry

**Decision:** HRB code is the anchor. All paths lead to HRB → industry detection → dynamic questions.

---

**Data Source Investigation (2026-03-16):**

| Source | Free? | Notes |
|--------|-------|-------|
| Northdata API | NO | €500/month minimum |
| Northdata website | YES | Manual only, no API |
| handelsregister.de | YES | 60 queries/hour, no API |
| **OffeneRegister.de** | YES | Open data, 5.1M companies, HAS API |
| **OpenRegister.de** | YES | Free REST API |
| bundesAPI/handelsregister | YES | Open source CLI (GitHub) |

**Best option: OffeneRegister.de** — free, has API, 5.1M companies

**AI Question Generation:**
- Confirmed possible with GPT-5.2
- Feed Gegenstand → AI generates industry-specific compliance questions
- No manual fallback needed (unless quality is poor)

**Corrected Flow:**
```
User enters company → HRB lookup (OffeneRegister API) → Get Gegenstand
                                    ↓
                    AI generates industry-specific questions
                                    ↓
                    User answers → AI generates compliance report
```

**Next:** Verify OffeneRegister API returns Gegenstand field.

---

**OffeneRegister Investigation Result:**
- OffeneRegister.de does NOT have Gegenstand field
- Only structural data: company name, HRB, officers, address, status
- Not usable for our industry detection needs

**bundesAPI/handelsregister Test (2026-03-16):**

Test setup:
- Cloned repo to `/test/handelsregister-test/`
- Created venv, installed dependencies (mechanize, beautifulsoup4)
- Attempted test query for "Orgonic Art"

Result: **FAILED — Connection timeout**
```
curl: (28) Failed to connect to www.handelsregister.de port 443 after 10001 ms
```

Findings:
1. handelsregister.de is NOT reachable (geo-blocked or requires German IP)
2. Even if it worked, bundesAPI only extracts search result fields (name, HRB, court, status)
3. **Does NOT extract Gegenstand** — would need to extend script to scrape detail pages

**Current Options:**

| Option | Cost | Effort | Reliability | Has Gegenstand? |
|--------|------|--------|-------------|-----------------|
| handelsregister.ai | 500 free credits, then ~€50/mo | Low | High | YES |
| Extend bundesAPI + German proxy | Proxy cost + dev time | High | Low (fragile) | Would need to add |
| User selects industry from dropdown | Free | Medium | High | N/A (user input) |

**Blocker:** Need German IP to access handelsregister.de for any scraping approach.

---

**VPS Discovery (2026-03-16):**

Found existing VPS in Autoflux projects:

| Project | VPS IP | Location |
|---------|--------|----------|
| Tyler | 89.117.36.82 | Lithuania |
| Moppity | 72.61.210.30 | Indonesia |
| **GlobalHair** | **187.77.93.207** | **Frankfurt, Germany** |

**Test Result:** GlobalHair VPS (Frankfurt) can access handelsregister.de!
```
curl -I https://www.handelsregister.de → HTTP/1.1 302 Found ✓
Full HTML page loads successfully ✓
```

**Solution:** Deploy handelsregister scraper on German VPS (GlobalHair or dedicated new one).

**Options:**
1. Use GlobalHair VPS for scraper microservice (free, already available)
2. Create separate German VPS for ComplyRadar ($5-10/mo)

**Next step:** Test bundesAPI script on German VPS to verify it extracts data correctly.

---

**Extended Script Development (2026-03-16):**

Created `handelsregister_extended.py` that:
1. Searches handelsregister.de for company
2. Downloads SI (Strukturierte Informationen) XML document
3. Extracts Gegenstand from XML (xJustiz format, tns:gegenstand tag)

**Test Results on German VPS:**
```
Orgonic Art GmbH → "die Entwicklung, Herstellung und der Vertrieb von Kunstgegenständen..."
Ali's Bäckerei → "der Betrieb einer Bäckerei und eines Restaurants."
```

**Script location:** `/test/handelsregister-test/handelsregister_extended.py`

**Production deployment options:**
1. Deploy as microservice on GlobalHair VPS (Frankfurt) — free
2. Create dedicated German VPS for ComplyRadar — ~$5-10/mo

**Rate limit:** 60 queries/hour (sufficient for early-stage B2B SaaS)

---

**VPS Pricing Research (2026-03-16):**

| Provider | Plan | vCPU | RAM | Storage | Traffic | Price/mo | Location |
|----------|------|------|-----|---------|---------|----------|----------|
| **Hetzner** | CX23 | 2 | 4 GB | 40 GB SSD | 20 TB | **€3.49** | Germany ✓ |
| Hetzner | CAX11 (ARM) | 2 | 4 GB | 40 GB SSD | 20 TB | €3.79 | Germany ✓ |
| Hetzner | CPX22 | 2 | 4 GB | 80 GB SSD | 20 TB | €5.99 → €7.99* | Germany ✓ |
| Hetzner | CX32 | 4 | 8 GB | 80 GB SSD | 20 TB | €6.80 | Germany ✓ |
| Hostinger | KVM1 | 1 | 4 GB | 50 GB NVMe | 4 TB | ~$4.99 | Germany ✓ |
| Hostinger | KVM2 | 2 | 8 GB | 100 GB NVMe | 8 TB | ~$6.99 | Germany ✓ |

*Price increase April 1, 2026

**Recommendation: Hetzner CX23 @ €3.49/month**
- Cheapest option with German datacenter
- 2 vCPU / 4 GB RAM = overkill for a lightweight Python scraper
- 20 TB traffic = more than enough (rate limit is 60 queries/hour anyway)
- Hourly billing: pay only for what you use
- All prices exclude VAT (add ~19% for Germany)
- **Final cost with VAT: ~€4.15/month**

**Alternative: Use existing GlobalHair VPS (free)**
- Already tested and working (187.77.93.207, Frankfurt)
- Concern: client project, mixing workloads
- Better to have dedicated VPS for ComplyRadar production

**Decision:** For production, recommend dedicated Hetzner CX23 at ~€4/month.

---

**Feature 1 Deliverables Breakdown:**

| Component | Status | Description |
|-----------|--------|-------------|
| Handelsregister scraper | ✅ Done | `handelsregister_extended.py` extracts Gegenstand |
| German VPS | ⏳ Raphael | Hetzner CX23 (~€5/mo) — Raphael's account |
| Scraper microservice | 🔨 Build | Flask API: `/api/company?search=X` → JSON |
| Next.js integration | 🔨 Build | API route calls German microservice |
| Company input UI | 🔨 Build | Search: "Enter company name or HRB" |
| AI question generator | 🔨 Build | GPT-5.2: Gegenstand → industry questions |
| Dynamic questionnaire | 🔨 Build | Render & collect AI-generated questions |
| Updated scan flow | 🔨 Build | Industry context → compliance report |

---

### Phase 2 Proposal for Raphael (2026-03-16)

**Client Spending Analysis (from Upwork history):**

| Project | Price | Type |
|---------|-------|------|
| **ComplyRadar MVP (you)** | **$960** | Fixed — his highest ever |
| Shopify Fishing Store | $550 | Fixed |
| Shopify CSS Developer | $130 | Fixed |
| Collection Image Display | $115 | Fixed |
| German VAs (3 ongoing) | $13-17/hr | ~$4,000-5,000 each |

- **Total spent:** $18K — serious buyer
- **100% hire rate** — commits when he posts
- **Your $960 = biggest fixed-price project** (74% more than next)
- **5-star review:** "perfect choice... we will keep working with him"

**Conclusion:** We were UNDERPRICING. He can and will pay close to MVP price.

---

**FINAL OFFER — All-Inclusive @ $830:**

---

### Milestone 1: Dynamic Questionnaire + Handelsregister — $450 (Up to 5 days)

---

#### FOR RAPHAEL & FABIAN: Complete Technical Explanation

**The Problem We're Solving:**

Right now, ComplyRadar has a fixed questionnaire designed for carpenters. But you have 8 agencies across different industries — bakeries, restaurants, construction, retail, etc. Each industry has completely different compliance requirements.

Manual approach = You'd need to build 20+ different questionnaires by hand. That doesn't scale.

Our solution = The system automatically detects the industry and generates the right questions.

---

**How It Works (Step by Step):**

```
STEP 1: Customer enters company name
        └── "Ali's Bäckerei GmbH"

STEP 2: System queries German Trade Registry (Handelsregister)
        └── Returns: "der Betrieb einer Bäckerei und eines Restaurants"
        └── This is the official "Gegenstand" (business purpose)

STEP 3: AI classifies the industry
        └── Input: "der Betrieb einer Bäckerei und eines Restaurants"
        └── Output: industry_code = "FOOD_BAKERY_RESTAURANT"

STEP 4: System checks database
        └── "Do we have questions for FOOD_BAKERY_RESTAURANT?"
        └── YES → Use cached template (instant)
        └── NO → AI generates new template → Save for future

STEP 5: Customer sees industry-specific questions
        └── "Do you have HACCP certification?"
        └── "How many employees handle food?"
        └── "Do you offer delivery services?"

STEP 6: Compliance scan runs with industry context
        └── Returns bakery + restaurant specific regulations
```

---

**Real Example (What Customer Sees):**

| Step | Screen | What Happens |
|------|--------|--------------|
| 1 | Search box | Customer types "Ali's Bäckerei" |
| 2 | Loading (2-3 sec) | System queries Handelsregister |
| 3 | Confirmation | "We found: Ali's Bäckerei GmbH — Bakery & Restaurant. Is this correct?" |
| 4 | Questionnaire | 10-15 questions specific to food service businesses |
| 5 | Results | Compliance report with HACCP, food safety, hygiene regulations |

---

**Why This Is Complex (Technical Challenges):**

| Challenge | Why It's Hard | Our Solution |
|-----------|---------------|--------------|
| **Handelsregister.de blocks non-German IPs** | The German government website only works from Germany | Deploy dedicated server in Frankfurt (Hetzner) |
| **No official API exists** | Handelsregister has no public API — must scrape HTML | Custom Python scraper that navigates the website like a human |
| **Data is in XML format** | Company details buried in complex XML (xJustiz format) | Parser extracts "Gegenstand" from nested XML structure |
| **Rate limit: 60 queries/hour** | Government site limits requests to prevent abuse | Caching layer — once we know an industry, we never ask again |
| **Thousands of possible industries** | Bakery, restaurant, carpenter, electrician, IT, retail... | AI classification normalizes variations into ~150-200 standard codes |
| **Form fields must be exact** | Dropdowns need options, numbers need min/max, etc. | Structured AI output with strict JSON schema |
| **Consistency across companies** | Two bakeries should get same questions | Database caching by industry_code — generate once, reuse forever |

---

**Infrastructure We're Building:**

```
┌─────────────────────────────────────────────────────────────────┐
│                        YOUR VERCEL APP                          │
│                      (smart-lex.de)                             │
└─────────────────────┬───────────────────────────────────────────┘
                      │ API call
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GERMAN VPS (Hetzner)                         │
│                    Frankfurt, Germany                           │
│                    ~€5/month                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Python Microservice                                     │   │
│  │  • Endpoint: /api/company?search=Ali's+Bäckerei         │   │
│  │  • Connects to Handelsregister.de                       │   │
│  │  • Extracts Gegenstand from XML                         │   │
│  │  • Returns: {name, hrb, gegenstand, court, status}      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────────┘
                      │ Gegenstand
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AI CLASSIFICATION                          │
│           "der Betrieb einer Bäckerei" → FOOD_BAKERY           │
└─────────────────────┬───────────────────────────────────────────┘
                      │ industry_code
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Table: industry_templates                               │   │
│  │  • industry_code (unique)                               │   │
│  │  • questions (JSON array of form fields)                │   │
│  │  • usage_count (how many times used)                    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

**What We Already Built & Tested:**

✅ Handelsregister scraper script (Python) — working
✅ Tested on German VPS — confirmed access to Handelsregister.de
✅ Gegenstand extraction from XML — working
✅ Example results:
   - "Orgonic Art GmbH" → "die Entwicklung, Herstellung und der Vertrieb von Kunstgegenständen"
   - "Ali's Bäckerei" → "der Betrieb einer Bäckerei und eines Restaurants"

**What We Still Need To Build:**

| Component | Effort | Description |
|-----------|--------|-------------|
| Flask microservice | 1 day | Wrap script in API with `/api/company` endpoint |
| Deploy to Hetzner | 0.5 day | Server setup, SSL, domain, monitoring |
| Next.js integration | 0.5 day | API route calls German server, handles errors |
| Company search UI | 0.5 day | Input field, loading state, confirmation screen |
| AI classification | 1 day | GPT prompt + logic to convert Gegenstand → industry_code |
| Template caching | 0.5 day | Database table + check-before-generate logic |
| AI question generator | 0.5 day | GPT prompt for form fields (JSON schema) |
| Dynamic form renderer | 0.5 day | Render JSON questions as actual form inputs |
| Testing & polish | 0.5 day | Error handling, edge cases, mobile |
| **Total** | **5 days** | |

---

**What You (Raphael) Need To Provide:**

| Item | Why | Your Effort |
|------|-----|-------------|
| Hetzner Cloud account | German IP required for Handelsregister | 10 min signup |
| Credit card for Hetzner | ~€5/month for CX23 server | Auto-billed |
| 3-5 test company names | We verify system works | 2 min |

We handle everything else: server setup, deployment, code, testing.

---

**Why $450 Is Fair:**

| Similar Work | Typical Cost |
|--------------|--------------|
| Custom API integration | $200-400 |
| Web scraping service | $150-300 |
| AI prompt engineering | $100-200 |
| Dynamic form builder | $200-400 |
| VPS deployment + DevOps | $100-200 |
| **Combined** | **$750-1,500** |

You're getting all of this for $450 because we already built and tested the core scraper.

---

**Risk Mitigation:**

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Handelsregister changes HTML structure | Low (government sites stable) | We monitor, fix within 24h |
| Rate limit exceeded | Low (caching prevents repeat queries) | Queue system for burst traffic |
| AI generates bad questions | Very low (GPT-5.2 reliable) | Human review option, feedback loop |
| Server downtime | Very low (Hetzner 99.9% SLA) | Health checks, alerts |

---

### Milestone 2: Stripe + Paywall — $180 (Up to 3 days)

**What your customers will experience:**
- Clear pricing page showing €190/6 months subscription
- Simple checkout: enter card → subscribe → instant access to Pro features
- Subscription management: view status, cancel anytime, update payment method
- Free users see limited results; subscribers see everything

**What you (Raphael) will receive:**
- Real payments flowing into your Stripe account
- Dashboard showing all subscribers, revenue, churn
- Automatic access control — no manual "granting" of Pro status
- Webhook notifications when someone subscribes/cancels

**What you need to provide / clarify:**
- Do you have a Stripe account already, or should we set one up?
- Confirm pricing: €190 for 6 months? Or different tiers?
- Should there be a free trial period before payment?

---

### Milestone 3: Referral System — $130 (Up to 3 days)

**What your customers will experience:**
- Personal referral link they can share (e.g., smart-lex.de/?ref=ABC123)
- Dashboard showing: "You invited 5 people, 2 subscribed"
- Reward when their referrals convert (discount, free month, etc.)

**What you (Raphael) will receive:**
- Viral growth engine — customers bring new customers
- Full tracking: who referred whom, conversion rates
- Admin view of top referrers and total referral revenue

**What you need to clarify:**
- What reward should referrers get? Options:
  - Free month added to their subscription?
  - €X discount on next billing?
  - Cash payout?
- What does the referred person get? (e.g., 10% off first subscription?)

---

### Milestone 4: Expert Improvements — $70 (Up to 2 days)

**What your customers will experience:**
- Experts shown are relevant to their industry (bakery sees food safety lawyers, not construction experts)
- Clear tags on each expert: "Tax Law", "Food Safety", "Employment", etc.
- Better profile cards with specializations visible at a glance

**What you (Raphael) will receive:**
- Higher contact rates — users see relevant experts
- Foundation for your consultant pricing model
- Easy to add new experts with proper categorization

**What you need to clarify:**
- What expert categories/tags do you want? Examples:
  - By topic: Tax, Legal, Safety, Insurance, HR, Environment?
  - By industry: Food & Beverage, Construction, Retail, Services?
- Any new experts to add, or just improve existing 8?

---

### Milestone 5: Expert Analytics — $100 (Up to 2 days)

**What your customers will experience:**
- No visible change — tracking happens in background

**What you (Raphael) will receive:**
- Dashboard showing: "247 people clicked 'Get Help', estimated 49 consultations"
- Conversion rate tracking (your 20% estimate verified with real data)
- Data to justify consultant pricing: "We send you X leads worth €Y"
- Export data to calculate fair €/month listing fee for experts

**What you need to clarify:**
- Which buttons to track? "Ask a Question", "Get Help", "Contact Expert"?
- Do you want email alerts when thresholds are hit? (e.g., "Expert X got 50 clicks this week")

---

### Summary Table

| M# | Feature | Price | Delivery | Needs from Raphael |
|----|---------|-------|----------|-------------------|
| 1 | Handelsregister + Dynamic Q | **$450** | 5 days | Hetzner account (~€5/mo) |
| 2 | Stripe + Paywall | $170 | 3 days | Stripe account, confirm €190/6mo pricing |
| 3 | Referral System | $120 | 3 days | Define reward structure |
| 4 | Expert Improvements | $60 | 2 days | Define tags/categories |
| 5 | Expert Analytics | $80 | 2 days | Confirm which buttons to track |
| **TOTAL** | **Everything** | **$880** | **15 days** | |

---

**Why $880 all-inclusive works:**
- Clean offer — all 5 features included
- Below MVP price ($960) — he saves $80
- Full transparency — complexity explained above
- Win probability: **80-85%**

**New Feature (from Slack 2026-03-16):**
- F-104: Expert Analytics — track "Ask a Question" clicks
- Purpose: Calculate conversion rate for consultant pricing model
- Example: 100 clicks × 20% conversion × €300 = €6,000 value → charge €50/mo listing
- Status: Backlog (Raphael said "just future stuff")

---

**Payment Structure (Upwork Milestones):**

| Milestone | Amount | Release When |
|-----------|--------|--------------|
| M1: Handelsregister + Dynamic Q | $400 | Feature delivered & tested |
| M2: Stripe + Paywall | $200 | Payments working |
| M3: Referral System | $150 | Referrals tracking |
| M4: Expert Improvements | $80 | UI polished |
| M5: Expert Analytics | $120 | (Optional/Future) |

**Recommendation:** Create contract with M1-M4 ($830), offer M5 as add-on.

---

**What Raphael Provides:**

| Item | Why Needed | Effort |
|------|------------|--------|
| Hetzner account | German VPS (~€5/mo) | 10 min |
| Stripe account + keys | Payment processing | 15 min |
| Test company names | Verify Handelsregister | 5 min |

---

**Timeline:**

| Week | Deliverable |
|------|-------------|
| Week 1 | M1: Dynamic Questionnaire + Handelsregister |
| Week 2 | M2: Stripe + Paywall |
| Week 3 | M3: Referral + M4: Expert improvements |

---

**Win Probability (REVISED):**

| Offer | Price | Win % | Reasoning |
|-------|-------|-------|-----------|
| M1-M4 package | $830 | **80%** | Close to MVP price, proven value |
| M1 only (start small) | $400 | **90%** | Low commitment, critical need |
| Full M1-M5 | $950 | **70%** | Higher but still justified |

**Strategy to Win:**
1. **Propose M1-M4 @ $830** — main offer
2. **Mention M1 @ $400 as fallback** — if hesitant
3. **Milestone payments** — pay after each delivery
4. **1-week per milestone** — shows urgency
5. **M5 as future add-on** — leaves door open

**Negotiation Floor:**
- M1 minimum: $350
- Full package minimum: $700
- Below this = not worth the complexity

---

### 2026-03-10 — Agentic Coding Infrastructure Setup
- Created `features.json` with 15 completed features + 3 planned
- Created `progress.md` (this file)
- Updated `CLAUDE.md` with session protocol
- Created `docs/ARCHITECTURE.md`
- Created `docs/DEPLOYMENT.md`
- Created `scripts/deploy.sh`, `scripts/verify-env.sh`, `scripts/health-check.sh`
- Created `.env.example`
