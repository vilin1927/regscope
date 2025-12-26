# Getting Started with Upwork Niche Analyzer

## ✅ What's Been Implemented

All core components have been built:

- ✅ Gmail API scraper ([backend/gmail_scraper.py](backend/gmail_scraper.py))
- ✅ Gemini Batch API analyzer ([backend/gemini_analyzer.py](backend/gemini_analyzer.py))
- ✅ SQLite database manager ([backend/db_manager.py](backend/db_manager.py))
- ✅ Flask REST API ([backend/app.py](backend/app.py))
- ✅ HTML Dashboard ([frontend/index.html](frontend/index.html))
- ✅ Project structure, dependencies, .gitignore, README

## 🔑 Required: API Credentials Setup

Before you can run the system, you need to set up two API credentials:

### 1. Gmail API Credentials

**Purpose:** To scrape Upwork job notification emails from your Gmail inbox

**Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable the **Gmail API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Application type: **Desktop app**
   - Name it "Upwork Scraper" (or any name)
   - Click "Create"
5. Download the JSON file
6. **Save it as `backend/credentials.json`** (exact filename and location)

**Note:** On first run, the scraper will open a browser window asking you to authorize access to your Gmail. This is normal and only happens once.

### 2. Gemini API Key

**Purpose:** To analyze job postings and extract niche/solution/budget data

**Steps:**
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Click "Get API Key"
3. Create a new API key (or use existing)
4. Copy the API key
5. Create a file `backend/.env` with this content:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
   (Replace `your_api_key_here` with your actual key)

**Cost Estimate:** Gemini 1.5 Flash is very cheap - expect ~$5-10 to analyze 50K jobs.

## 🚀 Running the System

Once you have the credentials set up, follow these steps:

### Step 1: Activate Virtual Environment

```bash
source venv/bin/activate
```

### Step 2: Test Scraper (Optional but Recommended)

Test with a small batch first to verify everything works:

```bash
cd backend
python gmail_scraper.py --test
```

This will scrape ~100 emails for testing. Check `data/scraped_jobs.json` to verify.

### Step 3: Run Full Scraper

```bash
python gmail_scraper.py
```

This will:
- Scrape all emails from `donotreply@upwork.com`
- Extract job title, description, budget, date
- Save to `data/scraped_jobs.json`
- Log progress every 1000 emails to `logs/scraper.log`

**Note:** Scraping 50K+ emails may take 30-60 minutes due to Gmail API rate limits.

### Step 4: Test Gemini Analyzer (Optional)

Test with first 5 jobs:

```bash
python gemini_analyzer.py --test
```

Check `data/analyzed_jobs.json` to verify the analysis quality.

### Step 5: Run Full Gemini Analysis

```bash
python gemini_analyzer.py
```

This will:
- Load all scraped jobs
- Analyze each with Gemini to extract:
  - Niche (specific business type)
  - Solution (what they're requesting)
  - Budget tier
  - Budget confidence
- Save to `data/analyzed_jobs.json`
- Log progress every 100 jobs to `logs/analyzer.log`

**Note:** Analyzing 50K jobs may take 4-8 hours due to API rate limits. The script includes automatic delays to avoid hitting limits.

### Step 6: Import to Database

```bash
python db_manager.py --import
```

This will:
- Create SQLite database at `data/upwork_jobs.db`
- Import all analyzed jobs
- Create indexes for fast queries
- Show summary stats

### Step 7: Start Backend API

In one terminal:

```bash
python app.py
```

API will run at `http://localhost:5000`

### Step 8: Open Dashboard

In another terminal (or just open in browser):

```bash
open ../frontend/index.html
```

Or manually open `frontend/index.html` in your browser.

The dashboard will:
- Display Top 10 Niches table
- Show Niche-Solution Matrix
- Allow filtering by solution category
- Export to CSV

## 📊 Using the Dashboard

### Top 10 Niches Table

Shows niches ranked by job count with:
- **Rank**: 1-10
- **Niche**: Specific business type (e.g., "Performance marketing agencies managing 20+ DTC clients")
- **Jobs**: Total job count for this niche
- **Avg Budget**: Calculated from budget tier midpoints
- **Budget Confidence**: % of jobs with HIGH confidence (shows ⚠️ if <50%)
- **Top Solution**: Most requested solution type for this niche

### Niche-Solution Matrix

- Rows: Top 10 niches
- Columns: Solution categories (Marketing Dashboard, CX Automation, etc.)
- Cells: Job count for that niche+solution combo
- **Top 3 combinations** are highlighted in blue
- **Click any cell** to filter the table by that solution

### Export

Click "Export to CSV" to download the current table view (with any filters applied).

## 🎯 Next Steps: Launch Cold Email Campaigns

Once you have the dashboard data:

1. **Identify 5-10 Target Niches:**
   - Look for niches with 50+ jobs
   - High budget confidence (>50%)
   - Average budget $3K-$10K+ (matches your offer)

2. **Match Solutions to Your Services:**
   - Use the matrix to see which solutions each niche requests most
   - Focus on niches requesting solutions you can deliver

3. **Build Your Campaign:**
   - Take the top niches (e.g., "Performance marketing agencies managing 20+ DTC clients")
   - Find 5,000+ similar companies via Apollo.io
   - Craft email copy that references their proven demand (e.g., "I noticed many agencies like yours are looking for marketing dashboard solutions...")

4. **Launch and Test:**
   - Run 100-200 emails/day per niche
   - Track reply rates after 2 weeks
   - Kill underperformers, scale winners

## 📁 Project Files

```
upwork_dashboard/
├── backend/
│   ├── gmail_scraper.py    # ✅ Scrapes Gmail for Upwork jobs
│   ├── gemini_analyzer.py  # ✅ Analyzes jobs with Gemini AI
│   ├── db_manager.py       # ✅ SQLite database operations
│   ├── app.py              # ✅ Flask REST API
│   ├── requirements.txt    # Python dependencies
│   ├── credentials.json    # ⚠️ YOU NEED TO ADD THIS
│   └── .env                # ⚠️ YOU NEED TO ADD THIS
├── frontend/
│   └── index.html          # ✅ HTML/JS dashboard
├── data/
│   ├── scraped_jobs.json   # Created by scraper
│   ├── analyzed_jobs.json  # Created by analyzer
│   └── upwork_jobs.db      # Created by db_manager
├── logs/                   # Application logs
├── README.md               # Full documentation
└── GETTING_STARTED.md      # This file
```

## ⚠️ Troubleshooting

### "credentials.json not found"
- Make sure you downloaded OAuth 2.0 credentials from Google Cloud Console
- Save as `backend/credentials.json` (exact location)

### "GEMINI_API_KEY not found"
- Create `backend/.env` file
- Add line: `GEMINI_API_KEY=your_actual_key`

### "No messages found" in scraper
- Verify you have Upwork job notification emails in Gmail
- Check they're from `donotreply@upwork.com`
- Check Gmail API is enabled in Google Cloud Console

### Dashboard shows "Failed to load data"
- Make sure the Flask API is running (`python backend/app.py`)
- Check it's running on `http://localhost:5000`
- Open browser console (F12) to see detailed error messages

### Rate limit errors
- The scripts include automatic delays
- If you still hit limits, add longer delays in the code
- Gmail API: Increase `time.sleep()` in gmail_scraper.py
- Gemini API: Increase delays in gemini_analyzer.py

## 💡 Tips

- **Run in test mode first** (`--test` flag) to verify everything works
- **Check logs** in `logs/` directory if something fails
- **Monitor progress** - scripts log every 100-1000 items processed
- **Be patient** - Full run may take several hours for 50K jobs
- **Start small** - You can run with just 1K jobs to get initial insights

## 🎉 Success Criteria

You'll know it's working when:

1. ✅ Scraper creates `data/scraped_jobs.json` with job data
2. ✅ Analyzer creates `data/analyzed_jobs.json` with niche/solution/budget
3. ✅ Database shows stats like "Total jobs: 50,247"
4. ✅ Dashboard displays Top 10 Niches table with real data
5. ✅ You can identify 5-10 validated niches to target

**Goal:** Launch cold email campaigns to 5-10 validated niches within 1 week, achieving 5-8% reply rate (vs current 0.67%).

---

**Questions?** Check `README.md` for more details or review the code files - they're well-commented!
