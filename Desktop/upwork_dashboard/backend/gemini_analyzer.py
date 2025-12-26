#!/usr/bin/env python3
"""
Gemini Batch API Analyzer for Upwork Jobs
Analyzes scraped jobs to extract niche, solution, budget tier, and confidence
"""

import os
import json
import logging
import time
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

# Configure logging
os.makedirs('../logs', exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('../logs/analyzer.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Gemini prompt template from PRD
ANALYSIS_PROMPT_TEMPLATE = """Analyze this Upwork job posting and extract key information.

JOB TITLE: {job_title}
JOB DESCRIPTION: {job_description}
POSTED BUDGET: {budget}

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
{{
  "niche": "Performance marketing agencies managing 20+ DTC clients",
  "solution": "Marketing Dashboard",
  "budget_tier": "$5-10K",
  "budget_confidence": "MEDIUM"
}}
"""


def initialize_gemini():
    """Initialize Gemini API with API key from .env"""
    api_key = os.getenv('GEMINI_API_KEY')

    if not api_key:
        logger.error("GEMINI_API_KEY not found in .env file")
        logger.error("Please create backend/.env with: GEMINI_API_KEY=your_api_key")
        raise ValueError("Missing GEMINI_API_KEY")

    genai.configure(api_key=api_key)
    logger.info("Gemini API initialized")

    return genai.GenerativeModel('gemini-1.5-flash')


def analyze_job(model, job):
    """
    Analyze a single job with Gemini

    Args:
        model: Gemini model instance
        job: Job dictionary with title, description, budget_raw

    Returns:
        Dict with niche, solution, budget_tier, budget_confidence
    """
    try:
        # Prepare prompt
        prompt = ANALYSIS_PROMPT_TEMPLATE.format(
            job_title=job.get('title', 'Not specified'),
            job_description=job.get('description', 'Not specified'),
            budget=job.get('budget_raw') or 'Not specified'
        )

        # Call Gemini API
        response = model.generate_content(prompt)

        # Parse JSON response
        response_text = response.text.strip()

        # Extract JSON from response (might have markdown code blocks)
        if '```json' in response_text:
            response_text = response_text.split('```json')[1].split('```')[0].strip()
        elif '```' in response_text:
            response_text = response_text.split('```')[1].split('```')[0].strip()

        analysis = json.loads(response_text)

        # Validate required fields
        required_fields = ['niche', 'solution', 'budget_tier', 'budget_confidence']
        for field in required_fields:
            if field not in analysis:
                logger.warning(f"Missing field '{field}' in response for job {job.get('job_id')}")
                analysis[field] = 'UNKNOWN'

        return analysis

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON for job {job.get('job_id')}: {e}")
        logger.error(f"Response was: {response_text[:200]}")
        return {
            'niche': 'UNKNOWN',
            'solution': 'Other',
            'budget_tier': 'UNKNOWN',
            'budget_confidence': 'LOW'
        }

    except Exception as e:
        logger.error(f"Error analyzing job {job.get('job_id')}: {e}")
        return {
            'niche': 'UNKNOWN',
            'solution': 'Other',
            'budget_tier': 'UNKNOWN',
            'budget_confidence': 'LOW'
        }


def analyze_jobs_batch(scraped_jobs_path='../data/scraped_jobs.json', test_mode=False):
    """
    Analyze all scraped jobs with Gemini

    Args:
        scraped_jobs_path: Path to scraped jobs JSON file
        test_mode: If True, only analyze first 5-10 jobs

    Returns:
        List of analyzed jobs
    """
    logger.info("=== Starting Gemini Batch Analysis ===")

    # Load scraped jobs
    if not os.path.exists(scraped_jobs_path):
        logger.error(f"Scraped jobs file not found: {scraped_jobs_path}")
        logger.error("Please run gmail_scraper.py first")
        return []

    with open(scraped_jobs_path, 'r', encoding='utf-8') as f:
        jobs = json.load(f)

    logger.info(f"Loaded {len(jobs)} jobs from {scraped_jobs_path}")

    # Test mode: analyze only first 5 jobs
    if test_mode:
        jobs = jobs[:5]
        logger.info(f"TEST MODE: Analyzing only {len(jobs)} jobs")

    # Initialize Gemini
    model = initialize_gemini()

    # Analyze each job
    analyzed_jobs = []
    failed = 0

    for i, job in enumerate(jobs, 1):
        try:
            # Analyze with Gemini
            analysis = analyze_job(model, job)

            # Merge with original job data
            analyzed_job = {
                **job,  # Original data (job_id, title, description, budget_raw, date_posted)
                **analysis  # Analysis (niche, solution, budget_tier, budget_confidence)
            }

            analyzed_jobs.append(analyzed_job)

            # Progress logging
            if i % 100 == 0:
                logger.info(f"Progress: {i}/{len(jobs)} jobs analyzed ({failed} failed)")

            # Rate limiting: Gemini has generous limits but let's be safe
            if i % 50 == 0:
                time.sleep(2)
            else:
                time.sleep(0.5)  # Small delay between requests

        except Exception as e:
            logger.error(f"Failed to analyze job {job.get('job_id')}: {e}")
            failed += 1

            # Add job with UNKNOWN values
            analyzed_job = {
                **job,
                'niche': 'UNKNOWN',
                'solution': 'Other',
                'budget_tier': 'UNKNOWN',
                'budget_confidence': 'LOW'
            }
            analyzed_jobs.append(analyzed_job)

    logger.info(f"=== Analysis Complete ===")
    logger.info(f"Total jobs analyzed: {len(jobs)}")
    logger.info(f"Successful: {len(analyzed_jobs) - failed}")
    logger.info(f"Failed: {failed}")
    logger.info(f"Success rate: {(len(analyzed_jobs) - failed)/len(jobs)*100:.1f}%")

    # Calculate UNKNOWN stats
    unknown_count = sum(1 for j in analyzed_jobs if j['niche'] == 'UNKNOWN')
    logger.info(f"Jobs with UNKNOWN niche: {unknown_count} ({unknown_count/len(analyzed_jobs)*100:.1f}%)")

    return analyzed_jobs


def save_analyzed_jobs(analyzed_jobs, output_path='../data/analyzed_jobs.json'):
    """Save analyzed jobs to JSON file"""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(analyzed_jobs, f, indent=2, ensure_ascii=False)

    logger.info(f"Saved {len(analyzed_jobs)} analyzed jobs to {output_path}")


if __name__ == '__main__':
    import sys

    # Check for test mode flag
    test_mode = '--test' in sys.argv

    # Run analysis
    analyzed_jobs = analyze_jobs_batch(test_mode=test_mode)

    if analyzed_jobs:
        save_analyzed_jobs(analyzed_jobs)
        logger.info("✓ Analysis successful! Data saved to data/analyzed_jobs.json")
    else:
        logger.error("✗ No jobs analyzed")
