# Plan: Rate Limit System Overhaul

## Goal

Simplify to 2 models with proper per-model rate tracking:
1. **Gemini 3 Flash** - All text analysis (high capacity: 1000 RPM)
2. **Gemini 3 Pro Image** - Image generation only (low capacity: 20 RPM)

---

## Current State

### Models in Code
```python
ANALYSIS_MODEL = 'gemini-3-pro-preview'      # 25 RPM, 250 RPD
IMAGE_MODEL = 'gemini-3-pro-image-preview'   # 20 RPM, 250 RPD
GROUNDING_MODEL = 'gemini-3-flash-preview'   # 1000 RPM, 10K RPD
```

### Problem
- Analysis uses Gemini 3 Pro (25 RPM) - wastes quota
- No per-model tracking - all calls counted together
- Image generation bottlenecked at 20 RPM

---

## Target State

### Models (Simplified)
```python
TEXT_MODEL = 'gemini-3-flash-preview'        # 1000 RPM, 10K RPD (ALL text)
IMAGE_MODEL = 'gemini-3-pro-image-preview'   # 20 RPM, 250 RPD (images only)
```

### Effective Capacity (5 Keys)
| Model | Total RPM | Total RPD |
|-------|-----------|-----------|
| Text (Flash) | 5000 | 50,000 |
| Image | 100 | 1,250 |

---

## Implementation Steps

### Step 1: Update Model Definitions

**File:** `gemini_service_v2.py`

```python
# BEFORE (3 models)
ANALYSIS_MODEL = 'gemini-3-pro-preview'
IMAGE_MODEL = 'gemini-3-pro-image-preview'
GROUNDING_MODEL = 'gemini-3-flash-preview'

# AFTER (2 models)
TEXT_MODEL = 'gemini-3-flash-preview'        # All text analysis
IMAGE_MODEL = 'gemini-3-pro-image-preview'   # Image generation only
```

Replace all uses of `ANALYSIS_MODEL` and `GROUNDING_MODEL` with `TEXT_MODEL`.

---

### Step 2: Update API Key Manager

**File:** `api_key_manager.py`

Add model-specific rate limits:

```python
# Rate limits per model type
RATE_LIMITS = {
    'text': {
        'rpm': 900,      # Safe limit for Flash (actual: 1000)
        'daily': 9000,   # Safe limit (actual: 10,000)
    },
    'image': {
        'rpm': 18,       # Safe limit for Pro Image (actual: 20)
        'daily': 240,    # Safe limit (actual: 250)
    }
}
```

Update Redis key structure:
```python
# OLD: Single counter
f"gemini:key:{key_id}:rpm"
f"gemini:key:{key_id}:daily"

# NEW: Per-model counters
f"gemini:key:{key_id}:{model_type}:rpm"
f"gemini:key:{key_id}:{model_type}:daily"
```

Update methods to accept `model_type` parameter:
- `get_available_key(model_type='image')`
- `record_usage(key, model_type='image')`
- `record_failure(key, model_type='image', is_rate_limit=False)`
- `get_key_usage(key, model_type='image')`

---

### Step 3: Update Queue Processor

**File:** `queue_processor.py`

Update to use model-specific key selection:

```python
# Get key specifically for image generation
key = manager.get_available_key(model_type='image')

# Record usage for image model
manager.record_usage(key, model_type='image')
```

---

### Step 4: Update Gemini Service

**File:** `gemini_service_v2.py`

Update all API call functions:

```python
# For text analysis calls
def analyze_slideshow(...):
    key = manager.get_available_key(model_type='text')
    response = client.models.generate_content(model=TEXT_MODEL, ...)
    manager.record_usage(key, model_type='text')

# For image generation calls
def generate_image(...):
    key = manager.get_available_key(model_type='image')
    response = client.models.generate_content(model=IMAGE_MODEL, ...)
    manager.record_usage(key, model_type='image')
```

---

### Step 5: Add Daily Limit Protection

**File:** `api_key_manager.py`

Add method to check if daily limit is approaching:

```python
def is_daily_limit_critical(self, model_type: str) -> bool:
    """Check if we're at 90%+ of daily limit."""
    summary = self.get_summary()
    model_summary = summary.get(model_type, {})
    total_available = model_summary.get('total_daily_available', 0)
    total_limit = len(self.keys) * RATE_LIMITS[model_type]['daily']
    return total_available < (total_limit * 0.1)
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `gemini_service_v2.py` | Replace 3 models with 2, update all model references |
| `api_key_manager.py` | Add model-specific tracking, new RATE_LIMITS config |
| `queue_processor.py` | Use `model_type='image'` for key selection |
| `image_queue.py` | Pass model_type through queue tasks |

---

## Testing Plan

1. **Unit test key manager** - Verify model-specific counters work
2. **Test key rotation** - Confirm keys rotate correctly per model
3. **Test rate limit handling** - Verify 429 errors mark correct model exhausted
4. **Integration test** - Run small batch (2 links, 5 images each)
5. **Full batch test** - Run 5 links with 10 images each

---

## Rollback Plan

If issues occur:
1. Revert model names back to original
2. Remove model_type parameters (use default)
3. Redis keys will auto-expire, no cleanup needed

---

## Deployment

```bash
# 1. Deploy code changes
ssh root@31.97.123.84 "cd /root/tiktok-slideshow-generator/Desktop/tiktok && git pull"

# 2. Restart services
ssh root@31.97.123.84 "systemctl restart tiktok-slideshow image-queue-processor celery-worker"

# 3. Clear old Redis counters
ssh root@31.97.123.84 "redis-cli KEYS 'gemini:key:*' | xargs redis-cli DEL"

# 4. Verify services running
ssh root@31.97.123.84 "systemctl status tiktok-slideshow image-queue-processor celery-worker"
```
