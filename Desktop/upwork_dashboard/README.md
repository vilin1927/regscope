# Upwork Niche Analyzer

A data-driven tool to analyze 50,000+ Upwork job postings and identify proven demand patterns for cold email campaign targeting.

## Overview

This tool:
1. Scrapes Upwork job notification emails from Gmail
2. Uses Gemini 3.0 Flash API to extract niche, solution type, and budget data
3. Stores analyzed data in SQLite database
4. Displays insights via React dashboard

## Setup

### Prerequisites
- Python 3.9+
- Node.js 16+ (for frontend)
- Gmail API credentials
- Gemini API key

### Installation

1. **Clone and setup virtual environment:**
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r backend/requirements.txt
```

2. **Configure Gmail API:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable Gmail API
   - Create OAuth 2.0 credentials (Desktop app)
   - Download credentials as `backend/credentials.json`

3. **Configure Gemini API:**
   - Get API key from [Google AI Studio](https://aistudio.google.com/)
   - Create `backend/.env` file:
     ```
     GEMINI_API_KEY=your_api_key_here
     ```

4. **Install frontend dependencies:**
```bash
cd frontend
npm install
```

## Usage

### 1. Scrape Upwork Job Emails

```bash
source venv/bin/activate
python backend/gmail_scraper.py
```

This will:
- Authenticate with Gmail (opens browser on first run)
- Fetch all emails from `donotreply@upwork.com`
- Extract job title, description, budget, and date
- Save to `data/scraped_jobs.json`

### 2. Analyze with Gemini

```bash
python backend/gemini_analyzer.py
```

This will:
- Load scraped jobs from `data/scraped_jobs.json`
- Send each job to Gemini for niche/solution/budget extraction
- Save analyzed data to `data/analyzed_jobs.json`

### 3. Import to Database

```bash
python backend/db_manager.py
```

Imports analyzed data into SQLite (`data/upwork_jobs.db`)

### 4. Start Backend API

```bash
python backend/app.py
```

Runs on `http://localhost:5000`

### 5. Start Frontend Dashboard

```bash
cd frontend
npm start
```

Opens dashboard at `http://localhost:3000`

## Dashboard Features

- **Top 10 Niches Table**: Ranked by job count, showing average budget and confidence
- **Niche-Solution Matrix**: Visual grid of niche+solution combinations
- **Filtering**: Click matrix cells to filter by solution category
- **Export**: Copy niche list to clipboard for campaign planning

## Project Structure

```
upwork_dashboard/
├── backend/
│   ├── gmail_scraper.py      # Gmail API scraper
│   ├── gemini_analyzer.py    # Gemini batch analysis
│   ├── db_manager.py          # SQLite database operations
│   ├── app.py                 # Flask API server
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # API credentials (gitignored)
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Main app component
│   │   ├── components/       # React components
│   │   └── services/         # API client
│   └── package.json
├── data/
│   ├── scraped_jobs.json     # Raw scraped data
│   ├── analyzed_jobs.json    # Analyzed data
│   └── upwork_jobs.db        # SQLite database
├── logs/                     # Application logs
└── README.md
```

## Success Metrics

- Scraping: 95%+ success rate for 50K+ emails
- Analysis: <10% jobs marked as UNKNOWN
- Dashboard: <3s load time
- Goal: Identify 5-10 validated niches for cold email campaigns

## License

Private tool for internal use
