# Product Requirements Document: Upwork Niche Analyzer

## Introduction/Overview

The Upwork Niche Analyzer is a data-driven tool designed to solve the problem of low cold email conversion rates caused by guessing which niches to target. Instead of blindly launching campaigns to industries like "CPA firms" (0.67% positive rate) or "SMM agencies" (complete failure), this system analyzes 50,000+ real Upwork job postings to identify proven demand patterns.

The tool scrapes Upwork job notification emails from Gmail, uses Gemini 3.0 Flash Batch API to extract structured data (niche, solution type, budget), and presents insights via a React dashboard. The output answers: **"Which 5-10 niches should I launch cold email campaigns for based on proven Upwork demand?"**

**Problem it solves:** Eliminates guesswork in niche selection by revealing where real companies are already paying $2K-20K for automation work, enabling targeted cold email campaigns with higher conversion rates.

## Goals

1. **Extract 50K+ Upwork job records** from Gmail with 95%+ success rate (job title, description, budget, date)
2. **Analyze all jobs via Gemini Batch API** to categorize each by specific niche, solution type, budget tier, and confidence level
3. **Display Top 10 niches** ranked by job count with minimum 20+ jobs threshold, showing average budget and confidence metrics
4. **Enable solution-based filtering** via Niche-Solution Matrix to identify which offer types are most requested per niche
5. **Support data-driven campaign selection** by allowing user to identify 5-10 validated niches for cold email outreach

## User Stories

**As a cold email campaign manager**, I want to see which niches have the most Upwork job postings so I can prioritize campaigns toward proven demand rather than guessing.

**As a business owner**, I want to know the average budget per niche and how confident those estimates are, so I can focus on niches willing to pay $2K-$10K+ for automation services.

**As a strategist**, I want to filter niches by solution type (Marketing Dashboard, CX Automation, etc.) so I can craft offers that match what each niche actually requests.

**As a campaign launcher**, I want to export or identify 5-10 validated niches from the dashboard so I can immediately start cold email outreach to 100X more companies outside Upwork.

## Functional Requirements

### Component A: Gmail API Scraper (Python)

1. The system must authenticate with Gmail API using OAuth 2.0
2. The system must filter emails from sender `donotreply@upwork.com`
3. The system must extract from each email:
   - Job title
   - Job description (full text)
   - Posted budget (if stated in email)
   - Date posted (from email timestamp)
4. The system must output scraped data as JSON array with structure:
   ```json
   [
     {
       "job_id": "unique_id",
       "title": "string",
       "description": "string",
       "budget_raw": "string or null",
       "date_posted": "ISO 8601 date"
     }
   ]
   ```
5. The system must handle rate limits and pagination for 50K+ emails
6. The system must log scraping progress (every 1000 emails processed)

### Component B: Gemini 3.0 Flash Batch Analysis (Python)

7. The system must send all scraped jobs to Gemini 3.0 Flash Batch API using the following prompt template:

```
Analyze this Upwork job posting and extract key information.

JOB TITLE: {job_title}
JOB DESCRIPTION: {job_description}
POSTED BUDGET: {budget}  # May be "Not specified", "$5,000", or "$50-100/hr"

TASK: Extract the following information.

1. NICHE (specific business type hiring, NOT generic industry):
   - Be SPECIFIC: "DTC subscription box brands using Shopify + ReCharge"
   - NOT generic: "E-commerce brands"
   - Examples: "Performance marketing agencies managing 20+ DTC clients", "3PL fulfillment providers with multi-warehouse operations", "B2B SaaS companies (Series B-D) in MarTech", "Medical practices with multiple locations"
   - If unclear from job description, return "Unknown"

2. SOLUTION (what they're requesting):
   - Choose ONE from: Marketing Dashboard, CX Automation, Fulfillment Automation, Competitor Intelligence, CRO/Funnel Optimization, Executive Reporting, Other
   - If "Other," specify what in the JSON

3. BUDGET_TIER:
   - If budget is explicitly stated → Use it directly
   - If budget is hourly rate → Calculate: Assume 40-80 hour project
   - If budget NOT stated → Estimate based on:
     * Job complexity (simple script vs full platform integration)
     * Client type mentioned (small business vs funded startup vs enterprise)
     * Project scope/timeline (1 week vs 3 months)
   - Return ONE of: <$2K, $2-5K, $5-10K, $10K-20K, $20K+, UNKNOWN

4. BUDGET_CONFIDENCE:
   - HIGH: Budget explicitly stated in job post
   - MEDIUM: Estimated from strong signals (client type, scope, complexity clearly described)
   - LOW: Weak signals, mostly guessing

Return ONLY valid JSON, no explanation:
{
  "niche": "Performance marketing agencies managing 20+ DTC clients",
  "solution": "Marketing Dashboard",
  "budget_tier": "$5-10K",
  "budget_confidence": "MEDIUM"
}
```

8. For each job, the system must extract:
   - **Niche** (specific, not broad): Examples: "DTC subscription box brands", "Performance marketing agencies managing 20+ clients", "3PL fulfillment providers"
   - **Solution**: One of [Marketing Dashboard, CX Automation, Fulfillment Automation, Competitor Intelligence, CRO/Funnel Optimization, Executive Reporting, Other]
   - **Budget Tier**: One of [<$2K, $2-5K, $5-10K, $10K-20K, $20K+, UNKNOWN]
   - **Budget Confidence**: One of [HIGH (stated in job), MEDIUM (estimated from signals), LOW (guessing)]
9. If Gemini cannot parse a job, the system must mark all fields as UNKNOWN and include the job in the dataset
10. The system must output structured JSON per job:
    ```json
    {
      "job_id": "unique_id",
      "niche": "string",
      "solution": "string",
      "budget_tier": "string",
      "budget_confidence": "string"
    }
    ```
11. The system must merge scraped data with Gemini analysis into final dataset for database import

### Component C: Database (SQLite)

12. The system must create a SQLite database with table `jobs` containing columns:
    - `id` (primary key)
    - `title` (text)
    - `description` (text)
    - `budget_raw` (text, nullable)
    - `date_posted` (date)
    - `niche` (text)
    - `solution` (text)
    - `budget_tier` (text)
    - `budget_confidence` (text)
13. The system must support querying jobs by niche, solution, date range, and budget tier

### Component D: React Dashboard (React + Tailwind)

14. The dashboard must display a **Top 10 Niches Table** with columns:
    - Rank (1-10)
    - Niche (specific name)
    - Jobs (count)
    - Avg Budget (calculated from budget_tier midpoints, shown as $ amount)
    - Budget Confidence (percentage of jobs with HIGH confidence)
    - Top Solution (most common solution category for that niche)
15. The table must sort niches by job count (descending)
16. The table must only show niches with 20+ jobs
17. The table must flag niches where <50% of jobs have HIGH budget confidence (visual indicator like ⚠️ icon or yellow highlight)
18. The dashboard must display a **Niche-Solution Matrix** with:
    - Rows: All niches (from Top 10 table)
    - Columns: Solution categories (Marketing Dashboard, CX Automation, etc.)
    - Cells: Job count for that niche+solution combination
    - Visual highlights for top 3 niche+solution combinations (by job count)
19. The matrix must allow clicking any cell to filter the Top 10 Niches Table to show only that solution category
20. The dashboard must include a "Reset Filters" button to restore default Top 10 view
21. The dashboard must be responsive and work on desktop screens (mobile optimization not required)
22. The dashboard must load data from SQLite database via API or direct query

### Additional Requirements

23. The system must provide a way to export selected niches (e.g., CSV or copy to clipboard) for campaign planning
24. The dashboard must show total jobs analyzed at the top (e.g., "Analyzed 50,247 jobs")
25. Budget averages must be calculated using midpoints of budget tiers:
    - <$2K = $1K
    - $2-5K = $3.5K
    - $5-10K = $7.5K
    - $10K+ = $12K
    - UNKNOWN = exclude from average, show separately
26. The system must handle jobs with UNKNOWN budget by showing them in the job count but excluding them from budget calculations

## Non-Goals (Out of Scope)

- **No Upwork account integration** - Only scrapes Gmail, does not interact with Upwork platform directly
- **No email sending functionality** - Dashboard identifies niches but does not send cold emails
- **No Apollo/CRM integration** - User manually takes niche list to Apollo for outreach
- **No real-time scraping** - Data is batch processed, not live
- **No skills extraction** - Only extracts niche, solution, and budget (not required skills, urgency, pain points, etc.)
- **No mobile app** - Dashboard is desktop web-only
- **No user authentication** - Single-user tool, no login required
- **No advanced filtering** - Only filter by solution category via matrix click, no custom date ranges or multi-filters in v1
- **No job detail pages** - No drill-down to individual job descriptions in dashboard

## Design Considerations

- **UI Framework**: React with Tailwind CSS for rapid styling
- **Table Component**: Use a simple HTML table or lightweight library (e.g., `react-table` if needed for sorting)
- **Matrix Visualization**: CSS Grid for Niche-Solution Matrix layout
- **Color Coding**:
  - High budget confidence (>50%): Green indicator
  - Low budget confidence (<50%): Yellow/orange warning icon (⚠️)
  - Top 3 matrix cells: Bold text or highlighted background
- **Typography**: Clean, readable fonts (Inter or system default)
- **No mockups required** - Junior developer should follow standard dashboard layout patterns

## Technical Considerations

- **Gmail API**: Use `google-auth-oauthlib` and `google-api-python-client` libraries for Python
- **Gemini API**: Use official Google Generative AI Python SDK for batch requests
- **Rate Limits**:
  - Gmail API: 250 quota units/user/second (handle pagination carefully)
  - Gemini Batch API: Async processing, 2-6 hours expected for 50K jobs
- **Database**: SQLite file stored locally (e.g., `upwork_jobs.db`)
- **Frontend-Backend Communication**:
  - Option A: React reads SQLite directly via SQL.js (browser-based)
  - Option B: Simple Python Flask/FastAPI backend serves JSON to React frontend
  - Recommend Option B for easier querying and aggregation
- **Cost Estimate**: ~$5-10 for Gemini 3.0 Flash Batch API processing 50K jobs
- **Data Storage**: Expect ~50-100MB for 50K jobs in SQLite
- **Error Handling**: Log all scraping/API errors to `logs/` directory with timestamps

## Success Metrics

1. **Scraping Success Rate**: 95%+ of emails successfully parsed into JSON
2. **Gemini Parsing Accuracy**: <10% of jobs marked as UNKNOWN for all fields
3. **Dashboard Load Time**: <3 seconds to load and render Top 10 table
4. **Niche Validation**: At least 5 niches meet the 20+ jobs threshold with >50% budget confidence
5. **Business Impact**: User identifies 5-10 niches and launches campaigns within 1 week of dashboard completion
6. **Cold Email Improvement**: Campaign reply rate increases from 0.67% to 5-8% within 2 weeks of targeting validated niches (measured externally)

## Open Questions - RESOLVED

1. **Gmail API Quota**: ✅ Auto-pause/resume if quota exceeded (handle gracefully)
2. **Gemini Prompt**: ✅ Prompt template provided above (use as-is)
3. **Niche Taxonomy**: ✅ Free generation - Gemini determines specific niches from job descriptions
4. **Budget Tier Ambiguity**: ✅ No strict rules - Gemini can make best judgment for edge cases
5. **Dashboard Hosting**: ✅ Local only - Run locally, no deployment needed
6. **Data Refresh**: ✅ One-time analysis - User will manually re-run later if needed, no automation

## Implementation Notes

- **Keep it simple**: This is a one-time data extraction and analysis tool
- **No over-engineering**: Store in local SQLite, view in local dashboard, export results
- **Goal**: Run scraper today, analyze with Gemini, view dashboard with insights, done
- **Timeline**: Complete end-to-end implementation in one session

---

**Next Steps**: ✅ PRD approved. Proceed to task generation using `generate-tasks.md` process.
