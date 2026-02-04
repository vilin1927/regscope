"""
TikTok Copy Routes
Flask API endpoints for TikTok slideshow to video conversion.
"""
import os
import re
import uuid
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename

from logging_config import get_logger

logger = get_logger('tiktok_copy_routes')

# Create blueprint
tiktok_copy_bp = Blueprint('tiktok_copy', __name__, url_prefix='/api/tiktok-copy')

# Import database functions
from database import (
    create_tiktok_copy_batch,
    create_tiktok_copy_job,
    get_tiktok_copy_batch,
    get_tiktok_copy_jobs,
    update_tiktok_copy_batch,
)

# Temp directory for uploaded product photos
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), 'temp', 'tiktok_copy_uploads')


def validate_tiktok_url(url: str) -> bool:
    """
    Validate that a URL is a valid TikTok slideshow/video URL.

    Supports:
    - https://www.tiktok.com/@username/photo/123456
    - https://www.tiktok.com/t/ABC123/
    - https://vm.tiktok.com/ABC123/
    """
    patterns = [
        r'https?://(www\.)?tiktok\.com/@[\w.-]+/(photo|video)/\d+',
        r'https?://(www\.)?tiktok\.com/t/\w+',
        r'https?://vm\.tiktok\.com/\w+',
    ]

    for pattern in patterns:
        if re.match(pattern, url.strip()):
            return True
    return False


def extract_links(text: str) -> list[str]:
    """
    Extract and validate TikTok links from text input.

    Args:
        text: Raw text input (one link per line)

    Returns:
        List of valid TikTok URLs
    """
    links = []
    for line in text.strip().split('\n'):
        url = line.strip()
        if url and validate_tiktok_url(url):
            links.append(url)
    return links


@tiktok_copy_bp.route('/convert', methods=['POST'])
def convert_tiktok():
    """
    Submit TikTok links for conversion to video.

    Request (multipart/form-data):
        links: Text with TikTok URLs (one per line)
        replace_slide: Optional slide number to replace (1-indexed)
        product_photo: Optional file upload

    Response:
        {
            "batch_id": "xxx",
            "jobs": [{"id": "...", "url": "...", "status": "pending"}, ...]
        }
    """
    logger.info("Received convert request")

    # Parse links from form data
    links_text = request.form.get('links', '')
    links = extract_links(links_text)

    if not links:
        return jsonify({
            'error': 'No valid TikTok links provided',
            'hint': 'Paste TikTok links, one per line'
        }), 400

    logger.info(f"Valid links: {len(links)}")

    # Parse optional replacement settings
    replace_slide = None
    replace_slide_str = request.form.get('replace_slide', '')
    if replace_slide_str:
        try:
            replace_slide = int(replace_slide_str)
            if replace_slide < 1:
                return jsonify({
                    'error': 'Invalid slide number',
                    'hint': 'Slide number must be a positive integer'
                }), 400
        except ValueError:
            return jsonify({
                'error': 'Invalid slide number',
                'hint': 'Slide number must be a positive integer'
            }), 400

    # Handle product photo upload
    product_photo_path = None
    if 'product_photo' in request.files:
        file = request.files['product_photo']
        if file and file.filename:
            # Secure the filename
            filename = secure_filename(file.filename)
            # Add unique prefix
            unique_filename = f"{uuid.uuid4().hex[:8]}_{filename}"

            # Create upload directory
            os.makedirs(UPLOAD_DIR, exist_ok=True)
            product_photo_path = os.path.join(UPLOAD_DIR, unique_filename)

            # Save file
            file.save(product_photo_path)
            logger.info(f"Product photo saved: {product_photo_path}")

    # Validate: if replace_slide is set, need product photo
    if replace_slide and not product_photo_path:
        return jsonify({
            'error': 'Product photo required for slide replacement',
            'hint': 'Upload a product photo when replacing a slide'
        }), 400

    # Create batch in database
    batch_id = create_tiktok_copy_batch(
        replace_slide=replace_slide,
        product_photo_path=product_photo_path
    )
    logger.info(f"Created batch: {batch_id}")

    # Create jobs for each link
    jobs = []
    for url in links:
        job_id = create_tiktok_copy_job(batch_id, url)
        jobs.append({
            'id': job_id,
            'url': url,
            'status': 'pending'
        })

    # Update batch total
    update_tiktok_copy_batch(batch_id)

    logger.info(f"Created {len(jobs)} jobs for batch {batch_id}")

    # Queue jobs for processing (Celery task)
    try:
        from tasks import process_tiktok_copy_batch
        process_tiktok_copy_batch.delay(batch_id)
        logger.info(f"Queued batch {batch_id} for processing")
    except ImportError as e:
        logger.warning(f"Celery task import failed (will use sync): {e}")
    except Exception as e:
        logger.warning(f"Failed to queue batch (will process sync): {e}")

    return jsonify({
        'batch_id': batch_id,
        'jobs': jobs,
        'replace_slide': replace_slide,
        'product_photo': bool(product_photo_path)
    })


@tiktok_copy_bp.route('/status/<batch_id>', methods=['GET'])
def get_status(batch_id: str):
    """
    Get status of a batch conversion.

    Response:
        {
            "batch_id": "xxx",
            "status": "processing",
            "total_jobs": 3,
            "completed_jobs": 1,
            "failed_jobs": 0,
            "drive_folder_url": "...",
            "jobs": [...]
        }
    """
    batch = get_tiktok_copy_batch(batch_id)
    if not batch:
        return jsonify({'error': 'Batch not found'}), 404

    jobs = get_tiktok_copy_jobs(batch_id)

    # Calculate status from jobs
    completed = sum(1 for j in jobs if j['status'] == 'completed')
    failed = sum(1 for j in jobs if j['status'] == 'failed')
    total = len(jobs)

    # Determine overall status
    if failed == total:
        status = 'failed'
    elif completed == total:
        status = 'completed'
    elif completed > 0 or failed > 0:
        status = 'processing'
    else:
        status = 'pending'

    return jsonify({
        'batch_id': batch_id,
        'status': status,
        'total_jobs': total,
        'completed_jobs': completed,
        'failed_jobs': failed,
        'drive_folder_url': batch.get('drive_folder_url'),
        'replace_slide': batch.get('replace_slide'),
        'jobs': [
            {
                'id': j['id'],
                'url': j['tiktok_url'],
                'status': j['status'],
                'drive_url': j.get('drive_url'),
                'error': j.get('error_message')
            }
            for j in jobs
        ]
    })


@tiktok_copy_bp.route('/validate', methods=['POST'])
def validate_links():
    """
    Validate TikTok links without processing.

    Request:
        { "links": "url1\\nurl2\\n..." }

    Response:
        { "valid": ["url1"], "invalid": ["url2"] }
    """
    data = request.get_json() or {}
    links_text = data.get('links', '')

    valid = []
    invalid = []

    for line in links_text.strip().split('\n'):
        url = line.strip()
        if not url:
            continue
        if validate_tiktok_url(url):
            valid.append(url)
        else:
            invalid.append(url)

    return jsonify({
        'valid': valid,
        'invalid': invalid,
        'valid_count': len(valid),
        'invalid_count': len(invalid)
    })
