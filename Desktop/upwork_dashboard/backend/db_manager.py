#!/usr/bin/env python3
"""
SQLite Database Manager for Upwork Jobs
Handles database creation, data import, and queries for dashboard
"""

import os
import json
import sqlite3
import logging
from typing import List, Dict, Optional

# Configure logging
os.makedirs('../logs', exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('../logs/db_manager.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

DB_PATH = '../data/upwork_jobs.db'


def get_connection():
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Return rows as dictionaries
    return conn


def create_schema():
    """Create database schema"""
    logger.info("Creating database schema...")

    conn = get_connection()
    cursor = conn.cursor()

    # Create jobs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            budget_raw TEXT,
            date_posted TEXT,
            niche TEXT,
            solution TEXT,
            budget_tier TEXT,
            budget_confidence TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Create indexes for common queries
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_niche ON jobs(niche)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_solution ON jobs(solution)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_date_posted ON jobs(date_posted)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_budget_tier ON jobs(budget_tier)')

    conn.commit()
    conn.close()

    logger.info("✓ Database schema created")


def import_analyzed_jobs(json_path='../data/analyzed_jobs.json'):
    """
    Import analyzed jobs from JSON file into database

    Args:
        json_path: Path to analyzed_jobs.json

    Returns:
        Number of jobs imported
    """
    logger.info(f"Importing jobs from {json_path}...")

    if not os.path.exists(json_path):
        logger.error(f"File not found: {json_path}")
        logger.error("Please run gemini_analyzer.py first")
        return 0

    # Load jobs
    with open(json_path, 'r', encoding='utf-8') as f:
        jobs = json.load(f)

    logger.info(f"Loaded {len(jobs)} jobs from JSON")

    # Insert into database
    conn = get_connection()
    cursor = conn.cursor()

    imported = 0
    skipped = 0

    for job in jobs:
        try:
            cursor.execute('''
                INSERT OR REPLACE INTO jobs
                (job_id, title, description, budget_raw, date_posted, niche, solution, budget_tier, budget_confidence)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                job.get('job_id'),
                job.get('title'),
                job.get('description'),
                job.get('budget_raw'),
                job.get('date_posted'),
                job.get('niche'),
                job.get('solution'),
                job.get('budget_tier'),
                job.get('budget_confidence')
            ))
            imported += 1

        except Exception as e:
            logger.error(f"Failed to import job {job.get('job_id')}: {e}")
            skipped += 1

    conn.commit()
    conn.close()

    logger.info(f"✓ Import complete: {imported} imported, {skipped} skipped")
    return imported


def get_top_niches(min_jobs=20, solution_filter=None):
    """
    Get top niches ranked by job count

    Args:
        min_jobs: Minimum number of jobs threshold (default 20)
        solution_filter: Optional solution category to filter by

    Returns:
        List of niche dictionaries with metrics
    """
    conn = get_connection()
    cursor = conn.cursor()

    # Build query
    query = '''
        SELECT
            niche,
            COUNT(*) as job_count,
            SUM(CASE WHEN budget_confidence = 'HIGH' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as high_confidence_pct
        FROM jobs
        WHERE niche != 'UNKNOWN' AND niche != 'Unknown'
    '''

    params = []
    if solution_filter:
        query += ' AND solution = ?'
        params.append(solution_filter)

    query += '''
        GROUP BY niche
        HAVING job_count >= ?
        ORDER BY job_count DESC
        LIMIT 10
    '''
    params.append(min_jobs)

    cursor.execute(query, params)
    niche_rows = cursor.fetchall()

    # Calculate average budget and top solution for each niche
    niches = []
    budget_midpoints = {
        '<$2K': 1000,
        '$2-5K': 3500,
        '$5-10K': 7500,
        '$10K-20K': 15000,
        '$20K+': 25000
    }

    for i, row in enumerate(niche_rows, 1):
        niche_name = row['niche']

        # Get all jobs for this niche
        cursor.execute('''
            SELECT budget_tier, solution
            FROM jobs
            WHERE niche = ?
        ''', (niche_name,))
        jobs = cursor.fetchall()

        # Calculate average budget (exclude UNKNOWN)
        budgets = [budget_midpoints.get(j['budget_tier'], 0) for j in jobs if j['budget_tier'] in budget_midpoints]
        avg_budget = sum(budgets) / len(budgets) if budgets else 0

        # Find top solution
        solution_counts = {}
        for j in jobs:
            sol = j['solution']
            solution_counts[sol] = solution_counts.get(sol, 0) + 1

        top_solution = max(solution_counts.items(), key=lambda x: x[1])[0] if solution_counts else 'Unknown'

        niches.append({
            'rank': i,
            'niche': niche_name,
            'job_count': row['job_count'],
            'avg_budget': avg_budget,
            'high_confidence_pct': round(row['high_confidence_pct'], 1),
            'top_solution': top_solution
        })

    conn.close()
    return niches


def get_niche_solution_matrix():
    """
    Get niche-solution matrix data

    Returns:
        Dict with niches, solutions, and matrix data
    """
    conn = get_connection()
    cursor = conn.cursor()

    # Get top 10 niches
    top_niches = get_top_niches()
    niche_names = [n['niche'] for n in top_niches]

    if not niche_names:
        return {'niches': [], 'solutions': [], 'matrix': []}

    # Get all solutions
    solutions = [
        'Marketing Dashboard',
        'CX Automation',
        'Fulfillment Automation',
        'Competitor Intelligence',
        'CRO/Funnel Optimization',
        'Executive Reporting',
        'Other'
    ]

    # Build matrix
    matrix = []
    for niche in niche_names:
        row = {'niche': niche, 'counts': {}}

        for solution in solutions:
            cursor.execute('''
                SELECT COUNT(*) as count
                FROM jobs
                WHERE niche = ? AND solution = ?
            ''', (niche, solution))

            count = cursor.fetchone()['count']
            row['counts'][solution] = count

        matrix.append(row)

    conn.close()

    # Find top 3 combinations
    all_combos = []
    for row in matrix:
        for solution, count in row['counts'].items():
            all_combos.append({
                'niche': row['niche'],
                'solution': solution,
                'count': count
            })

    top_3_combos = sorted(all_combos, key=lambda x: x['count'], reverse=True)[:3]

    return {
        'niches': niche_names,
        'solutions': solutions,
        'matrix': matrix,
        'top_3': top_3_combos
    }


def get_stats():
    """
    Get overall statistics

    Returns:
        Dict with total job count and other stats
    """
    conn = get_connection()
    cursor = conn.cursor()

    # Total jobs
    cursor.execute('SELECT COUNT(*) as total FROM jobs')
    total_jobs = cursor.fetchone()['total']

    # UNKNOWN count
    cursor.execute("SELECT COUNT(*) as unknown FROM jobs WHERE niche = 'UNKNOWN' OR niche = 'Unknown'")
    unknown_jobs = cursor.fetchone()['unknown']

    # Unique niches
    cursor.execute("SELECT COUNT(DISTINCT niche) as unique_niches FROM jobs WHERE niche != 'UNKNOWN' AND niche != 'Unknown'")
    unique_niches = cursor.fetchone()['unique_niches']

    conn.close()

    return {
        'total_jobs': total_jobs,
        'unknown_jobs': unknown_jobs,
        'unique_niches': unique_niches,
        'valid_jobs': total_jobs - unknown_jobs
    }


if __name__ == '__main__':
    import sys

    logger.info("=== Database Manager ===")

    # Create schema
    create_schema()

    # Import data
    if '--import' in sys.argv or len(sys.argv) == 1:
        import_analyzed_jobs()

        # Show stats
        stats = get_stats()
        logger.info(f"Total jobs in database: {stats['total_jobs']}")
        logger.info(f"Valid jobs: {stats['valid_jobs']}")
        logger.info(f"Unknown jobs: {stats['unknown_jobs']}")
        logger.info(f"Unique niches: {stats['unique_niches']}")

        # Show top niches
        logger.info("\nTop 10 Niches:")
        top_niches = get_top_niches()
        for niche in top_niches:
            logger.info(f"  {niche['rank']}. {niche['niche']}: {niche['job_count']} jobs, ${niche['avg_budget']:.0f} avg, {niche['high_confidence_pct']}% high confidence")

    # Query test
    if '--test' in sys.argv:
        logger.info("\n=== Testing Queries ===")

        stats = get_stats()
        logger.info(f"Stats: {stats}")

        niches = get_top_niches()
        logger.info(f"Top niches: {len(niches)}")

        matrix = get_niche_solution_matrix()
        logger.info(f"Matrix: {len(matrix['niches'])} niches x {len(matrix['solutions'])} solutions")

    logger.info("\n✓ Database manager ready")
