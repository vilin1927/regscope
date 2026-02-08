# API Rate Limit System - Technical Documentation

## Overview

The TikTok Slideshow Generator uses Google's Gemini API for AI-powered content generation. This document describes the multi-key rotation system with model-specific rate limiting.

---

## Architecture

### Models Used

| Model | API Name | Purpose | RPM Limit | RPD Limit |
|-------|----------|---------|-----------|-----------|
| **Gemini 3 Flash** | `gemini-3-flash-preview` | Analysis + Grounding | 1000 | 10,000 |
| **Gemini 3 Pro Image** | `gemini-3-pro-image-preview` | Image Generation | 20 | 250 |

### API Key Rotation

The system uses **5 API keys from 5 different Google Cloud projects** to multiply the effective quota:

```
Project 1 (Key 1) ─┐
Project 2 (Key 2) ─┤
Project 3 (Key 3) ─┼── Round-robin rotation ──> API Calls
Project 4 (Key 4) ─┤
Project 5 (Key 5) ─┘
```

**Important:** Rate limits are per PROJECT, not per API key. Using 5 keys from the same project provides NO additional quota. Each key must be from a separate Google Cloud project.

### Effective Capacity (5 Keys)

| Model | Per-Key RPM | Total RPM | Per-Key RPD | Total RPD |
|-------|-------------|-----------|-------------|-----------|
| Flash (Analysis) | 1000 | **5000** | 10,000 | **50,000** |
| Image Generation | 20 | **100** | 250 | **1,250** |

---

## Implementation

### File Structure

```
backend/
├── api_key_manager.py    # Key rotation + rate tracking
├── gemini_service_v2.py  # Model definitions + API calls
├── queue_processor.py    # Image generation queue
└── image_queue.py        # Queue management
```

### Redis Keys for Tracking

```
# Per-key, per-model tracking
gemini:key:{key_id}:flash:rpm      # Flash RPM counter (expires 60s)
gemini:key:{key_id}:flash:daily    # Flash daily counter (expires midnight PT)
gemini:key:{key_id}:image:rpm      # Image RPM counter (expires 60s)
gemini:key:{key_id}:image:daily    # Image daily counter (expires midnight PT)
```

### Rate Limit Configuration

```python
# api_key_manager.py
RATE_LIMITS = {
    'flash': {
        'rpm': 900,      # Safe limit (actual: 1000)
        'daily': 9000,   # Safe limit (actual: 10,000)
    },
    'image': {
        'rpm': 18,       # Safe limit (actual: 20)
        'daily': 240,    # Safe limit (actual: 250)
    }
}
```

---

## Flow Diagrams

### Slideshow Generation Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    SLIDESHOW GENERATION                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. SCRAPE           2. ANALYZE              3. GENERATE IMAGES  │
│  ┌──────────┐        ┌──────────────┐        ┌────────────────┐ │
│  │ TikTok   │   ──>  │ Gemini Flash │   ──>  │ Gemini 3 Pro   │ │
│  │ Scraper  │        │ (Analysis)   │        │ Image          │ │
│  │          │        │              │        │                │ │
│  │ RapidAPI │        │ 1000 RPM     │        │ 20 RPM         │ │
│  └──────────┘        └──────────────┘        └────────────────┘ │
│       │                    │                        │           │
│       v                    v                        v           │
│  [Slides]           [Scene Prompts]          [AI Images]        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### API Key Selection Flow

```
get_available_key(model_type='image')
        │
        v
┌───────────────────────────────┐
│ For each key (round-robin):   │
│   1. Check RPM < limit        │
│   2. Check Daily < limit      │
│   3. If available, return key │
└───────────────────────────────┘
        │
        v
┌─────────────────────────────────────┐
│ All keys exhausted?                 │
│   - RPM: Wait 60s for reset         │
│   - Daily: Wait until midnight PT   │
└─────────────────────────────────────┘
```

---

## Usage Tracking

### Recording Successful Requests

```python
manager = get_api_key_manager()
key = manager.get_available_key(model_type='image')

try:
    response = generate_image(key, prompt)
    manager.record_usage(key, model_type='image')
except RateLimitError:
    manager.record_failure(key, model_type='image', is_rate_limit=True)
```

### Checking Capacity

```python
summary = manager.get_summary()
# Returns:
{
    'total_keys': 5,
    'flash': {
        'available_keys': 5,
        'total_rpm_available': 4500,
        'total_daily_available': 45000
    },
    'image': {
        'available_keys': 3,
        'total_rpm_available': 54,
        'total_daily_available': 720
    },
    'seconds_until_daily_reset': 28800
}
```

---

## Batch Processing

### Queue Processor Configuration

```python
# queue_processor.py
BATCH_SIZE = 5          # Images per batch (respect 100 RPM total)
BATCH_INTERVAL = 60     # Seconds between batches
MAX_RETRIES = 3         # Retry failed tasks
RATE_LIMIT_PAUSE = 70   # Pause on 429 errors
```

### Throughput Calculation

With 5 keys at 20 RPM each for image generation:
- **Max sustained throughput:** 100 images/minute
- **Max daily capacity:** 1,250 images/day

For a batch of 5 TikTok links with 10 images each:
- Total images needed: 50
- Time to complete: ~30-60 seconds (with overhead)

---

## Error Handling

### Rate Limit (429) Response

1. Mark current key as exhausted for 60s
2. Try next key in rotation
3. If all keys exhausted, pause queue for 70s
4. After pause, retry from first key

### Daily Limit Exhausted

1. Log warning with time until reset
2. Skip image generation for this job
3. Mark job as "daily_limit_exceeded"
4. Notify user to retry after midnight PT

---

## Monitoring

### Admin Endpoints

```
GET /api/admin/api-keys/status
Returns current usage for all keys and models

GET /api/admin/api-keys/reset
Manually reset all counters (admin only)
```

### Log Messages

```
INFO  | Selected key #3 (AIzaSyCm) | Image RPM: 5/18 | Daily: 120/240
WARN  | Key AIzaSyCm hit rate limit, marked exhausted for 60s
ERROR | All 5 API keys exhausted for image model!
```

---

## Configuration

### Environment Variables

```bash
# .env file
GEMINI_API_KEYS=key1,key2,key3,key4,key5   # Comma-separated, 5 keys
GEMINI_API_KEY=key1                         # Fallback single key
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_QUEUE_DB=1
```

### Adding New Keys

1. Create new Google Cloud project
2. Enable Gemini API
3. Create API key
4. Add to `GEMINI_API_KEYS` env var
5. Restart services

---

## Troubleshooting

### All Keys Hitting Rate Limit Immediately

**Cause:** Keys are from the same project (shared quota)
**Fix:** Verify each key is from a different Google Cloud project

### Daily Limit Reached Before Expected

**Cause:** Other processes using same keys, or retry storms
**Fix:** Check for duplicate queue processors, verify retry logic

### Images Not Generating

**Cause:** Queue processor not running or stuck
**Fix:** `systemctl restart image-queue-processor`

---

## Version History

| Date | Change |
|------|--------|
| 2026-02-08 | Switched analysis to Gemini 3 Flash, added model-specific tracking |
| 2026-02-07 | Added 5-key rotation from different projects |
| 2026-01-XX | Initial single-key implementation |
