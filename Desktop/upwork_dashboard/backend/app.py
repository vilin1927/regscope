#!/usr/bin/env python3
"""
Flask API Server for Upwork Niche Analyzer Dashboard
Provides REST API endpoints for dashboard data
"""

import os
import logging
from flask import Flask, jsonify, request
from flask_cors import CORS
from db_manager import get_top_niches, get_niche_solution_matrix, get_stats

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for local development


@app.route('/api/stats', methods=['GET'])
def stats():
    """
    Get overall statistics

    Returns:
        JSON: {total_jobs, valid_jobs, unknown_jobs, unique_niches}
    """
    try:
        stats_data = get_stats()
        return jsonify(stats_data), 200

    except Exception as e:
        logger.error(f"Error fetching stats: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/top-niches', methods=['GET'])
def top_niches():
    """
    Get top 10 niches ranked by job count

    Query Parameters:
        min_jobs (int): Minimum jobs threshold (default 20)
        solution (str): Filter by solution category (optional)

    Returns:
        JSON: Array of niche objects
    """
    try:
        min_jobs = int(request.args.get('min_jobs', 20))
        solution_filter = request.args.get('solution')

        niches = get_top_niches(min_jobs=min_jobs, solution_filter=solution_filter)

        return jsonify({
            'niches': niches,
            'count': len(niches)
        }), 200

    except ValueError as e:
        return jsonify({'error': 'Invalid parameter format'}), 400
    except Exception as e:
        logger.error(f"Error fetching top niches: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/niche-solution-matrix', methods=['GET'])
def niche_solution_matrix():
    """
    Get niche-solution matrix data

    Returns:
        JSON: {niches: [...], solutions: [...], matrix: [...], top_3: [...]}
    """
    try:
        matrix_data = get_niche_solution_matrix()
        return jsonify(matrix_data), 200

    except Exception as e:
        logger.error(f"Error fetching matrix: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'service': 'upwork-niche-analyzer'}), 200


@app.route('/', methods=['GET'])
def index():
    """API index"""
    return jsonify({
        'service': 'Upwork Niche Analyzer API',
        'version': '1.0',
        'endpoints': {
            '/api/stats': 'Get overall statistics',
            '/api/top-niches': 'Get top 10 niches (query params: min_jobs, solution)',
            '/api/niche-solution-matrix': 'Get niche-solution matrix data',
            '/api/health': 'Health check'
        }
    }), 200


if __name__ == '__main__':
    logger.info("=== Starting Upwork Niche Analyzer API ===")
    logger.info("API will be available at http://localhost:5000")
    logger.info("Endpoints:")
    logger.info("  GET /api/stats")
    logger.info("  GET /api/top-niches?min_jobs=20&solution=Marketing%20Dashboard")
    logger.info("  GET /api/niche-solution-matrix")
    logger.info("  GET /api/health")

    # Run Flask app
    app.run(host='0.0.0.0', port=5000, debug=True)
