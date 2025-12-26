#!/usr/bin/env python3
"""
Gmail API Scraper for Upwork Job Notifications
Fetches emails from donotreply@upwork.com and extracts job details
"""

import os
import json
import base64
import re
import time
import logging
from datetime import datetime
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Gmail API scopes
SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

# Configure logging
os.makedirs('../logs', exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('../logs/scraper.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


def authenticate_gmail():
    """Authenticate with Gmail API using OAuth 2.0"""
    creds = None
    token_path = 'token.json'
    credentials_path = 'credentials.json'

    # Load existing credentials
    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)

    # If no valid credentials, authenticate
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            logger.info("Refreshing expired credentials...")
            creds.refresh(Request())
        else:
            if not os.path.exists(credentials_path):
                logger.error(f"Credentials file not found: {credentials_path}")
                logger.error("Please download OAuth 2.0 credentials from Google Cloud Console")
                logger.error("and save as backend/credentials.json")
                raise FileNotFoundError(f"{credentials_path} not found")

            logger.info("Starting OAuth 2.0 authentication flow...")
            flow = InstalledAppFlow.from_client_secrets_file(credentials_path, SCOPES)
            creds = flow.run_local_server(port=0)

        # Save credentials for next run
        with open(token_path, 'w') as token:
            token.write(creds.to_json())
        logger.info("Credentials saved to token.json")

    return creds


def fetch_emails(service, sender='donotreply@upwork.com', max_results=None):
    """
    Fetch emails from specified sender

    Args:
        service: Gmail API service instance
        sender: Email address to filter by
        max_results: Maximum number of emails to fetch (None = all)

    Returns:
        List of message IDs
    """
    logger.info(f"Fetching emails from {sender}...")

    try:
        query = f'from:{sender}'
        messages = []
        page_token = None
        page_count = 0

        while True:
            page_count += 1
            logger.info(f"Fetching page {page_count}...")

            # Fetch message list
            results = service.users().messages().list(
                userId='me',
                q=query,
                pageToken=page_token,
                maxResults=500  # Max per page
            ).execute()

            if 'messages' in results:
                messages.extend(results['messages'])
                logger.info(f"  Found {len(results['messages'])} messages on this page (total so far: {len(messages)})")

            # Check for more pages
            page_token = results.get('nextPageToken')
            if not page_token or (max_results and len(messages) >= max_results):
                break

            # Rate limit: slight delay between pages
            time.sleep(0.1)

        if max_results:
            messages = messages[:max_results]

        logger.info(f"Total messages found: {len(messages)}")
        return messages

    except HttpError as error:
        logger.error(f"An error occurred: {error}")
        return []


def parse_email_content(email_data):
    """
    Parse email content to extract job details

    Args:
        email_data: Email message data from Gmail API

    Returns:
        Dict with job_id, title, description, budget_raw, date_posted
    """
    try:
        # Get message ID
        msg_id = email_data['id']

        # Get headers
        headers = {h['name']: h['value'] for h in email_data['payload']['headers']}
        subject = headers.get('Subject', '')
        date_str = headers.get('Date', '')

        # Parse date
        try:
            # Gmail date format: "Wed, 01 Jan 2023 12:00:00 +0000"
            date_obj = datetime.strptime(date_str.split('(')[0].strip(), '%a, %d %b %Y %H:%M:%S %z')
            date_posted = date_obj.isoformat()
        except:
            date_posted = datetime.now().isoformat()

        # Get email body
        body = ''
        if 'parts' in email_data['payload']:
            for part in email_data['payload']['parts']:
                if part['mimeType'] == 'text/plain' and 'data' in part['body']:
                    body = base64.urlsafe_b64decode(part['body']['data']).decode('utf-8')
                    break
                elif part['mimeType'] == 'text/html' and not body and 'data' in part['body']:
                    body = base64.urlsafe_b64decode(part['body']['data']).decode('utf-8')
        elif 'body' in email_data['payload'] and 'data' in email_data['payload']['body']:
            body = base64.urlsafe_b64decode(email_data['payload']['body']['data']).decode('utf-8')

        # Extract job title from subject
        # Common patterns: "Job Posting: [Title]", "[Title] - Upwork", etc.
        title = subject.replace('New job matches your profile -', '').replace('Job Posting:', '').strip()
        if ' - Upwork' in title:
            title = title.split(' - Upwork')[0].strip()

        # Extract budget from body (if present)
        budget_raw = None
        budget_patterns = [
            r'\$[\d,]+(?:\.\d{2})?(?:\s*-\s*\$[\d,]+(?:\.\d{2})?)?',  # $5,000 or $5,000 - $10,000
            r'\$[\d,]+/hr',  # $50/hr
            r'Budget:\s*\$[\d,]+',  # Budget: $5000
            r'Hourly Rate:\s*\$[\d,]+-\$[\d,]+',  # Hourly Rate: $50-$100
        ]

        for pattern in budget_patterns:
            match = re.search(pattern, body)
            if match:
                budget_raw = match.group(0)
                break

        # Clean up description (remove HTML tags if present)
        description = re.sub(r'<[^>]+>', '', body)
        description = description.strip()[:5000]  # Limit to 5000 chars

        return {
            'job_id': msg_id,
            'title': title,
            'description': description,
            'budget_raw': budget_raw,
            'date_posted': date_posted
        }

    except Exception as e:
        logger.error(f"Error parsing email {email_data.get('id', 'unknown')}: {e}")
        return None


def scrape_upwork_jobs(max_emails=None, test_mode=False):
    """
    Main scraper function

    Args:
        max_emails: Maximum number of emails to scrape (None = all)
        test_mode: If True, only scrape 10-100 emails for testing

    Returns:
        List of job dictionaries
    """
    logger.info("=== Starting Upwork Job Scraper ===")

    if test_mode:
        max_emails = 100
        logger.info("TEST MODE: Scraping max 100 emails")

    # Authenticate
    creds = authenticate_gmail()
    service = build('gmail', 'v1', credentials=creds)

    # Fetch email list
    messages = fetch_emails(service, sender='donotreply@upwork.com', max_results=max_emails)

    if not messages:
        logger.warning("No messages found")
        return []

    # Parse each email
    jobs = []
    failed = 0

    for i, msg in enumerate(messages, 1):
        try:
            # Fetch full message data
            email_data = service.users().messages().get(
                userId='me',
                id=msg['id'],
                format='full'
            ).execute()

            # Parse email
            job = parse_email_content(email_data)
            if job:
                jobs.append(job)
            else:
                failed += 1

            # Progress logging
            if i % 1000 == 0:
                logger.info(f"Progress: {i}/{len(messages)} emails processed ({len(jobs)} jobs extracted, {failed} failed)")

            # Rate limit: small delay
            if i % 100 == 0:
                time.sleep(1)

        except HttpError as error:
            logger.error(f"Error fetching message {msg['id']}: {error}")
            failed += 1

            # Handle rate limits
            if error.resp.status == 429:
                logger.warning("Rate limit hit, waiting 60 seconds...")
                time.sleep(60)

        except Exception as e:
            logger.error(f"Unexpected error processing message {msg['id']}: {e}")
            failed += 1

    logger.info(f"=== Scraping Complete ===")
    logger.info(f"Total emails processed: {len(messages)}")
    logger.info(f"Jobs extracted: {len(jobs)}")
    logger.info(f"Failed: {failed}")
    logger.info(f"Success rate: {len(jobs)/len(messages)*100:.1f}%")

    return jobs


def save_jobs_to_json(jobs, output_path='../data/scraped_jobs.json'):
    """Save jobs to JSON file"""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(jobs, f, indent=2, ensure_ascii=False)

    logger.info(f"Saved {len(jobs)} jobs to {output_path}")


if __name__ == '__main__':
    import sys

    # Check for test mode flag
    test_mode = '--test' in sys.argv

    # Run scraper
    jobs = scrape_upwork_jobs(test_mode=test_mode)

    if jobs:
        save_jobs_to_json(jobs)
        logger.info("✓ Scraping successful! Data saved to data/scraped_jobs.json")
    else:
        logger.error("✗ No jobs scraped")
