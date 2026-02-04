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
    Submit TikTok links for conversion to video with per-link settings.

    Request (multipart/form-data):
        links_config: JSON array of link configurations:
            [
                {"url": "https://tiktok.com/...", "replace_slide": null, "photo_index": null},
                {"url": "https://tiktok.com/...", "replace_slide": 2, "photo_index": 0},
                ...
            ]
        product_photo_0: File upload for first link with replacement
        product_photo_1: File upload for second link with replacement
        ...

    Response:
        {
            "batch_id": "xxx",
            "jobs": [{"id": "...", "url": "...", "status": "pending", "replace_slide": 2}, ...]
        }
    """
    import json

    logger.info("Received convert request")

    # Parse links configuration from form data
    links_config_str = request.form.get('links_config', '')

    if not links_config_str:
        return jsonify({
            'error': 'No links configuration provided',
            'hint': 'Submit links_config JSON array'
        }), 400

    try:
        links_config = json.loads(links_config_str)
    except json.JSONDecodeError as e:
        return jsonify({
            'error': 'Invalid JSON in links_config',
            'hint': str(e)
        }), 400

    if not links_config or not isinstance(links_config, list):
        return jsonify({
            'error': 'No links provided',
            'hint': 'links_config must be a non-empty array'
        }), 400

    # Validate all URLs first
    valid_configs = []
    for idx, cfg in enumerate(links_config):
        url = cfg.get('url', '').strip()
        if not url:
            continue
        if not validate_tiktok_url(url):
            return jsonify({
                'error': f'Invalid TikTok URL at index {idx}',
                'url': url
            }), 400
        valid_configs.append(cfg)

    if not valid_configs:
        return jsonify({
            'error': 'No valid TikTok links provided',
            'hint': 'Check your URLs are valid TikTok slideshow links'
        }), 400

    logger.info(f"Valid links: {len(valid_configs)}")

    # Save uploaded photos with index mapping
    photo_paths = {}
    for key in request.files:
        if key.startswith('product_photo_'):
            try:
                idx = int(key.split('_')[-1])
            except ValueError:
                continue

            file = request.files[key]
            if file and file.filename:
                filename = secure_filename(file.filename)
                unique_filename = f"{uuid.uuid4().hex[:8]}_{filename}"
                os.makedirs(UPLOAD_DIR, exist_ok=True)
                photo_path = os.path.join(UPLOAD_DIR, unique_filename)
                file.save(photo_path)
                photo_paths[idx] = photo_path
                logger.info(f"Saved product photo {idx}: {photo_path}")

    # Create batch in database (no global settings anymore)
    batch_id = create_tiktok_copy_batch()
    logger.info(f"Created batch: {batch_id}")

    # Create jobs with per-link settings
    jobs = []
    for cfg in valid_configs:
        url = cfg.get('url', '').strip()
        replace_slide = cfg.get('replace_slide')
        photo_index = cfg.get('photo_index')

        # Validate replace_slide
        if replace_slide is not None:
            try:
                replace_slide = int(replace_slide)
                if replace_slide < 1:
                    return jsonify({
                        'error': 'Invalid slide number',
                        'hint': 'Slide number must be a positive integer',
                        'url': url
                    }), 400
            except (ValueError, TypeError):
                return jsonify({
                    'error': 'Invalid slide number',
                    'hint': 'Slide number must be a positive integer',
                    'url': url
                }), 400

        # Get photo path for this job
        product_photo_path = None
        if photo_index is not None and photo_index in photo_paths:
            product_photo_path = photo_paths[photo_index]

        # Validate: if replace_slide is set, need product photo
        if replace_slide and not product_photo_path:
            return jsonify({
                'error': 'Product photo required for slide replacement',
                'hint': 'Upload a product photo for this link',
                'url': url
            }), 400

        # Create job with per-link settings
        job_id = create_tiktok_copy_job(
            batch_id=batch_id,
            tiktok_url=url,
            replace_slide=replace_slide,
            product_photo_path=product_photo_path
        )
        jobs.append({
            'id': job_id,
            'url': url,
            'status': 'pending',
            'replace_slide': replace_slide,
            'has_photo': bool(product_photo_path)
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
        'total_photos': len(photo_paths)
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
        'jobs': [
            {
                'id': j['id'],
                'url': j['tiktok_url'],
                'status': j['status'],
                'replace_slide': j.get('replace_slide'),
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
