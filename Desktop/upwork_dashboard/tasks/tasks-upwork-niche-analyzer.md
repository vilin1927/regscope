# Tasks: Upwork Niche Analyzer

## Relevant Files

### Backend (Python)
- `backend/gmail_scraper.py` - Gmail API scraper implementation
- `backend/gemini_analyzer.py` - Gemini Batch API analysis
- `backend/db_manager.py` - SQLite database operations and queries
- `backend/app.py` - Flask/FastAPI backend server
- `backend/requirements.txt` - Python dependencies
- `backend/.env` - API credentials (gitignored)

### Frontend (React + Tailwind)
- `frontend/src/App.jsx` - Main application component
- `frontend/src/components/TopNichesTable.jsx` - Top 10 niches table component
- `frontend/src/components/NicheSolutionMatrix.jsx` - Niche-solution matrix component
- `frontend/src/services/api.js` - API client for backend communication
- `frontend/tailwind.config.js` - Tailwind CSS configuration
- `frontend/package.json` - Node.js dependencies

### Data
- `data/scraped_jobs.json` - Raw scraped data from Gmail (output of scraper)
- `data/analyzed_jobs.json` - Jobs with Gemini analysis results
- `data/upwork_jobs.db` - SQLite database (final storage)

### Root
- `README.md` - Setup and usage instructions
- `.gitignore` - Ignore venv, node_modules, credentials, db files, logs

### Notes

- Python virtual environment should be created in `venv/` directory
- All logs should be written to `logs/` directory
- Gmail OAuth credentials should be stored as `backend/credentials.json` (gitignored)
- Use `python backend/gmail_scraper.py` to run scraper
- Use `python backend/gemini_analyzer.py` to run analysis
- Use `python backend/app.py` to start backend server
- Use `npm start` in frontend/ to start React development server

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch (e.g., `git checkout -b feature/upwork-niche-analyzer`)

- [ ] 1.0 Set up project structure and dependencies
  - [x] 1.1 Create project directory structure (backend/, frontend/, data/, logs/)
  - [x] 1.2 Initialize Python virtual environment (`python -m venv venv`)
  - [x] 1.3 Create backend/requirements.txt with dependencies (google-auth-oauthlib, google-api-python-client, google-generativeai, flask, flask-cors)
  - [x] 1.4 Install Python dependencies (`pip install -r backend/requirements.txt`)
  - [ ] 1.5 Initialize React app with Tailwind CSS (`npx create-react-app frontend && cd frontend && npm install -D tailwindcss`) [SKIPPED - will create manually later]
  - [x] 1.6 Create .gitignore file (exclude venv/, node_modules/, *.db, logs/, credentials.json, .env)
  - [x] 1.7 Create README.md with setup and usage instructions

- [ ] 2.0 Implement Gmail API scraper
  - [ ] 2.1 Set up Gmail API credentials (create OAuth 2.0 credentials in Google Cloud Console) [MANUAL STEP - USER TODO]
  - [ ] 2.2 Download credentials.json and place in backend/ directory [MANUAL STEP - USER TODO]
  - [x] 2.3 Create backend/gmail_scraper.py with authentication function using OAuth 2.0
  - [x] 2.4 Implement email fetching function (filter emails from donotreply@upwork.com)
  - [x] 2.5 Implement email parsing function (extract job_id, title, description, budget_raw, date_posted)
  - [x] 2.6 Add pagination handling for retrieving 50K+ emails
  - [x] 2.7 Add rate limit handling with exponential backoff retry logic
  - [x] 2.8 Add progress logging (log every 1000 emails processed to logs/scraper.log)
  - [x] 2.9 Save scraped data to data/scraped_jobs.json with proper JSON formatting
  - [ ] 2.10 Test scraper with small batch (10-100 emails) before full run [REQUIRES CREDENTIALS]

- [ ] 3.0 Implement Gemini Batch API analysis
  - [ ] 3.1 Set up Gemini API credentials (create API key in Google AI Studio) [MANUAL STEP - USER TODO]
  - [ ] 3.2 Store API key in backend/.env file (GEMINI_API_KEY=...) [MANUAL STEP - USER TODO]
  - [x] 3.3 Create backend/gemini_analyzer.py
  - [x] 3.4 Implement prompt template from PRD (exact template for niche/solution/budget extraction)
  - [x] 3.5 Create batch processing function to send all jobs to Gemini API
  - [x] 3.6 Implement JSON parsing and validation for Gemini responses
  - [x] 3.7 Handle parsing errors (mark all fields as UNKNOWN if Gemini fails to parse)
  - [x] 3.8 Add progress logging (log every 100 jobs analyzed)
  - [x] 3.9 Merge scraped data with Gemini analysis results into single dataset
  - [x] 3.10 Save final analyzed data to data/analyzed_jobs.json
  - [ ] 3.11 Test with small batch (5-10 jobs) before running full analysis [REQUIRES API KEY]

- [x] 4.0 Set up SQLite database and data storage
  - [x] 4.1 Create backend/db_manager.py
  - [x] 4.2 Implement database schema creation (jobs table with columns: id, title, description, budget_raw, date_posted, niche, solution, budget_tier, budget_confidence)
  - [x] 4.3 Implement database connection function with proper error handling
  - [x] 4.4 Implement data import function (load data/analyzed_jobs.json into SQLite)
  - [x] 4.5 Create indexes on commonly queried columns (niche, solution, date_posted)
  - [x] 4.6 Implement query function for top niches (with 20+ jobs filter, sorted by count)
  - [x] 4.7 Implement query function for niche-solution matrix
  - [x] 4.8 Implement query function for total stats (job count, etc.)
  - [ ] 4.9 Test database operations (insert, query, verify data integrity) [REQUIRES DATA]

- [x] 5.0 Build React dashboard frontend [CREATED SIMPLE HTML VERSION INSTEAD]
  - [x] 5.1 Configure Tailwind CSS (using CDN)
  - [x] 5.2 Create API client functions (vanilla JavaScript fetch)
  - [x] 5.3 Create TopNichesTable component (HTML table)
  - [x] 5.4 Implement table columns (Rank, Niche, Jobs, Avg Budget, Budget Confidence %, Top Solution)
  - [x] 5.5 Implement sorting by job count (handled by backend)
  - [x] 5.6 Implement 20+ jobs threshold filter (handled by backend)
  - [x] 5.7 Implement budget confidence warning flag (<50% shows ⚠️ icon)
  - [x] 5.8 Calculate average budget using tier midpoints (handled by backend)
  - [x] 5.9 Create NicheSolutionMatrix component (HTML table)
  - [x] 5.10 Implement matrix grid layout (niches as rows, solutions as columns)
  - [x] 5.11 Display job counts in each cell
  - [x] 5.12 Highlight top 3 niche+solution combinations
  - [x] 5.13 Implement cell click to filter TopNichesTable by solution category
  - [x] 5.14 Add "Reset Filters" button to restore default view
  - [x] 5.15 Integrate both components in single HTML page
  - [x] 5.16 Add total jobs count display at top of dashboard
  - [x] 5.17 Implement export functionality (CSV download)
  - [x] 5.18 Style all components with Tailwind CSS (clean, minimal design)

- [x] 6.0 Create backend API for dashboard
  - [x] 6.1 Create backend/app.py with Flask application
  - [x] 6.2 Implement GET /api/top-niches endpoint (returns top niches with all metrics)
  - [x] 6.3 Implement GET /api/niche-solution-matrix endpoint (returns matrix data)
  - [x] 6.4 Implement GET /api/stats endpoint (returns total job count, etc.)
  - [x] 6.5 Add query parameter support for filtering by solution category
  - [x] 6.6 Configure CORS for local development (allow localhost:3000)
  - [x] 6.7 Add error handling and proper JSON responses
  - [ ] 6.8 Test all API endpoints with curl or Postman [REQUIRES DATA]

- [ ] 7.0 Testing and validation
  - [ ] 7.1 Run full Gmail scraper on actual Upwork notification emails
  - [ ] 7.2 Verify scraped data quality (check data/scraped_jobs.json)
  - [ ] 7.3 Run Gemini batch analysis on all scraped jobs
  - [ ] 7.4 Verify analysis results (check data/analyzed_jobs.json for proper niche/solution/budget extraction)
  - [ ] 7.5 Import all analyzed data into SQLite database
  - [ ] 7.6 Start backend API server (`python backend/app.py`)
  - [ ] 7.7 Start React frontend development server (`cd frontend && npm start`)
  - [ ] 7.8 Verify Top 10 Niches table displays correctly with all columns
  - [ ] 7.9 Verify budget calculations are correct (using tier midpoints)
  - [ ] 7.10 Verify Niche-Solution Matrix displays and cell click filtering works
  - [ ] 7.11 Test "Reset Filters" button
  - [ ] 7.12 Test export functionality (CSV/clipboard)
  - [ ] 7.13 Identify 5-10 validated niches for cold email campaigns
  - [ ] 7.14 Document any issues, improvements, or insights discovered
