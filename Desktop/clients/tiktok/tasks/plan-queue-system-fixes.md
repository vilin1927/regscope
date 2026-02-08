# Plan: Queue System Production Fixes

## Overview

Fix critical issues in the image queue system to make it production-ready. Based on software architecture and code review analysis.

**Current State:** Prototype (4/10 production readiness)
**Target State:** Production-ready (8/10)

---

## Phase 1: Critical Fixes (Immediate)

### Fix 1.1: Auto-Cleanup Stale Tasks

**Problem:** Tasks with missing temp files retry forever, require manual clearing.

**Files:** `backend/queue_processor.py`

**Changes:**
```python
# Add to BatchProcessor.__init__()
self._startup_cleanup_done = False

# Add new method
def _run_startup_cleanup(self):
    """Clean stale tasks on processor startup."""
    if self._startup_cleanup_done:
        return

    logger.info("Running startup cleanup...")

    # 1. Clear tasks older than 2 hours
    # 2. Clear tasks with missing reference files
    # 3. Clear orphaned tasks (no job data)

    cleaned = self._cleanup_all_stale_tasks()
    logger.info(f"Startup cleanup complete: {cleaned} stale tasks removed")
    self._startup_cleanup_done = True

def _cleanup_all_stale_tasks(self) -> int:
    """Comprehensive cleanup of all stale tasks."""
    cleaned = 0

    # Clean pending queue
    cleaned += self._cleanup_queue(self.queue.PENDING_KEY, max_age_hours=2)

    # Clean retry queue
    cleaned += self._cleanup_queue(self.queue.RETRY_KEY, max_age_hours=1)

    # Clean processing queue (stuck tasks)
    cleaned += self._cleanup_queue(self.queue.PROCESSING_KEY, max_age_hours=0.5)

    return cleaned

def _cleanup_queue(self, queue_key: str, max_age_hours: float) -> int:
    """Clean stale tasks from a specific queue."""
    cleaned = 0
    task_ids = self.queue.redis.zrange(queue_key, 0, -1)

    for task_id in task_ids:
        task = self.queue._get_task(task_id)
        if not task:
            # Orphaned task - remove
            self.queue.redis.zrem(queue_key, task_id)
            cleaned += 1
            continue

        # Check missing files
        if task.reference_image_path and not os.path.exists(task.reference_image_path):
            self._remove_task(task_id, queue_key, "missing reference file")
            cleaned += 1
            continue

        # Check age
        if task.created_at:
            age_hours = self._get_task_age_hours(task.created_at)
            if age_hours > max_age_hours:
                self._remove_task(task_id, queue_key, f"too old ({age_hours:.1f}h)")
                cleaned += 1

    return cleaned
```

**Call from:** `_run_loop()` at start, before first batch.

---

### Fix 1.2: Distinguish Free Tier vs Rate Limit Errors

**Problem:** "free_tier" errors treated as rate limits, bad keys keep being used.

**Files:** `backend/queue_processor.py`, `backend/api_key_manager.py`

**Changes to queue_processor.py:**
```python
# In _generate_image() exception handler
except Exception as e:
    error_str = str(e).lower()
    last_error = e

    # Check for FREE TIER error (billing not enabled)
    if 'free_tier' in error_str or 'limit: 0' in error_str:
        logger.error(f"Key {api_key[:8]} has FREE TIER - no quota! Remove this key.")
        _record_api_usage(api_key, success=False, is_free_tier=True, model_type='image')
        # Don't retry with this key - it will never work
        continue

    # Check for rate limit / quota error
    if '429' in error_str or 'resource_exhausted' in error_str:
        _record_api_usage(api_key, success=False, is_rate_limit=True, model_type='image')
        logger.warning(f"Key {api_key[:8]} rate limited, trying next...")
        continue
```

**Changes to api_key_manager.py:**
```python
def record_failure(self, key: str, model_type: str = 'image',
                   is_rate_limit: bool = False, is_free_tier: bool = False):
    """Record that a request failed."""
    key_id = self._get_key_id(key)

    if is_free_tier:
        # Mark key as permanently unusable for this model
        free_tier_key = f"{KEY_PREFIX}{key_id}:{model_type}:free_tier"
        self.redis.set(free_tier_key, "true")
        # No expiry - permanent until manually fixed
        logger.error(f"Key {key_id} marked as FREE TIER for {model_type} - will be skipped")

    elif is_rate_limit:
        # Temporary exhaustion
        rpm_key = f"{KEY_PREFIX}{key_id}:{model_type}:rpm"
        self.redis.set(rpm_key, limits['rpm'])
        self.redis.expire(rpm_key, 60)

def get_key_usage(self, key: str, model_type: str = 'image') -> Dict:
    """Get current usage stats for a key."""
    key_id = self._get_key_id(key)

    # Check if key is marked as free tier (permanently unusable)
    free_tier_key = f"{KEY_PREFIX}{key_id}:{model_type}:free_tier"
    is_free_tier = self.redis.get(free_tier_key) == "true"

    if is_free_tier:
        return {
            'key_id': key_id,
            'is_available': False,
            'reason': 'free_tier'
        }

    # ... rest of existing logic
```

---

### Fix 1.3: Add Circuit Breaker

**Problem:** System keeps retrying when all API keys are exhausted.

**Files:** `backend/queue_processor.py`

**Changes:**
```python
# Add to BatchProcessor class
CIRCUIT_BREAKER_THRESHOLD = 3  # Consecutive all-key failures before opening circuit
CIRCUIT_BREAKER_RESET_TIME = 300  # 5 minutes

def __init__(self, ...):
    # ... existing init
    self._consecutive_all_key_failures = 0
    self._circuit_open_until = 0

def _check_circuit_breaker(self) -> bool:
    """Check if circuit breaker is open (should skip processing)."""
    if time.time() < self._circuit_open_until:
        remaining = self._circuit_open_until - time.time()
        logger.warning(f"Circuit breaker OPEN - skipping batch ({remaining:.0f}s remaining)")
        return True
    return False

def _record_all_keys_exhausted(self):
    """Record that all keys failed in a batch."""
    self._consecutive_all_key_failures += 1

    if self._consecutive_all_key_failures >= CIRCUIT_BREAKER_THRESHOLD:
        self._circuit_open_until = time.time() + CIRCUIT_BREAKER_RESET_TIME
        logger.error(f"Circuit breaker OPENED - {self._consecutive_all_key_failures} consecutive failures. "
                    f"Pausing for {CIRCUIT_BREAKER_RESET_TIME}s")

def _record_success(self):
    """Record successful image generation - resets circuit breaker."""
    self._consecutive_all_key_failures = 0
```

**Integrate into _run_loop():**
```python
def _run_loop(self):
    while not self._stop_event.is_set():
        # Check circuit breaker first
        if self._check_circuit_breaker():
            self._stop_event.wait(BATCH_INTERVAL)
            continue

        # ... rest of loop
```

---

### Fix 1.4: Add Health Endpoint

**Problem:** No way to check if system is healthy.

**Files:** `backend/app.py` (add endpoint)

**Changes:**
```python
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for monitoring."""
    health = {
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'checks': {}
    }

    # Check Redis
    try:
        redis_client.ping()
        health['checks']['redis'] = 'ok'
    except:
        health['checks']['redis'] = 'error'
        health['status'] = 'unhealthy'

    # Check queue processor (via Redis key)
    try:
        last_heartbeat = redis_client.get('queue_processor:heartbeat')
        if last_heartbeat:
            age = time.time() - float(last_heartbeat)
            if age < 120:  # 2 minutes
                health['checks']['queue_processor'] = 'ok'
            else:
                health['checks']['queue_processor'] = f'stale ({age:.0f}s)'
                health['status'] = 'degraded'
        else:
            health['checks']['queue_processor'] = 'unknown'
    except:
        health['checks']['queue_processor'] = 'error'

    # Check API keys
    try:
        manager = get_api_key_manager()
        summary = manager.get_summary('image')
        available = summary['image']['available_keys']
        total = summary['total_keys']
        health['checks']['api_keys'] = f'{available}/{total} available'
        if available == 0:
            health['status'] = 'degraded'
    except:
        health['checks']['api_keys'] = 'error'

    status_code = 200 if health['status'] == 'healthy' else 503
    return jsonify(health), status_code
```

**Add heartbeat to queue_processor.py:**
```python
def _run_loop(self):
    while not self._stop_event.is_set():
        # Update heartbeat
        self.queue.redis.set('queue_processor:heartbeat', str(time.time()))

        # ... rest of loop
```

---

### Fix 1.5: Add Redis TTL to All Keys

**Problem:** Data grows forever in Redis.

**Files:** `backend/image_queue.py`

**Changes:**
```python
# Add TTL constants
TASK_DATA_TTL = 86400  # 24 hours
JOB_DATA_TTL = 86400   # 24 hours
RESULT_TTL = 86400     # 24 hours

# In submit() method
def submit(self, task: ImageTask) -> str:
    # ... existing code

    # Store task data WITH TTL
    task_key = f"{self.TASK_DATA_PREFIX}{task.task_id}"
    self.redis.hset(task_key, mapping=task.to_dict())
    self.redis.expire(task_key, TASK_DATA_TTL)  # ADD THIS

    # ... rest of method

# In mark_complete() method
def mark_complete(self, task_id: str, result_path: str):
    # ... existing code

    # Store result WITH TTL
    self.redis.set(f"{self.RESULTS_PREFIX}{task_id}", result_path)
    self.redis.expire(f"{self.RESULTS_PREFIX}{task_id}", RESULT_TTL)  # ADD THIS
```

---

## Phase 2: High Priority Fixes (This Week)

### Fix 2.1: Split Long Functions

**Problem:** `_cleanup_stale_tasks()` is 120+ lines.

**Solution:** Extract into smaller functions:
- `_cleanup_orphaned_tasks()`
- `_cleanup_missing_file_tasks()`
- `_cleanup_expired_tasks()`

### Fix 2.2: Replace Bare Except Clauses

**Problem:** `except:` hides bugs.

**Solution:** Replace with specific exceptions:
```python
# Before
except:
    pass

# After
except (json.JSONDecodeError, TypeError, KeyError) as e:
    logger.warning(f"Failed to parse task data: {e}")
```

### Fix 2.3: Move Hardcoded Values to Config

**Problem:** Timeouts scattered in code.

**Solution:** Create `config.py`:
```python
# backend/config.py
import os

class QueueConfig:
    BATCH_SIZE = int(os.getenv('QUEUE_BATCH_SIZE', '15'))
    BATCH_INTERVAL = int(os.getenv('QUEUE_BATCH_INTERVAL', '20'))
    MAX_RETRIES = int(os.getenv('QUEUE_MAX_RETRIES', '3'))
    TASK_TTL_HOURS = int(os.getenv('QUEUE_TASK_TTL_HOURS', '24'))
    STALE_TASK_HOURS = float(os.getenv('QUEUE_STALE_TASK_HOURS', '2'))
    CIRCUIT_BREAKER_THRESHOLD = int(os.getenv('CIRCUIT_BREAKER_THRESHOLD', '3'))
    CIRCUIT_BREAKER_RESET_SECONDS = int(os.getenv('CIRCUIT_BREAKER_RESET', '300'))
```

### Fix 2.4: Add Startup Validation

**Problem:** System starts without checking dependencies.

**Solution:** Add validation in `main()`:
```python
def main():
    # Validate Redis connection
    try:
        redis_client.ping()
    except:
        logger.critical("Cannot connect to Redis!")
        sys.exit(1)

    # Validate API keys
    manager = get_api_key_manager()
    if len(manager.keys) == 0:
        logger.critical("No API keys configured!")
        sys.exit(1)

    # Check for free tier keys
    for key in manager.keys:
        usage = manager.get_key_usage(key, 'image')
        if usage.get('reason') == 'free_tier':
            logger.warning(f"Key {key[:8]} is FREE TIER - will be skipped")

    # ... rest of startup
```

---

## Phase 3: Production Ready (Next Sprint)

### Fix 3.1: Add Prometheus Metrics

```python
from prometheus_client import Counter, Gauge, Histogram

# Metrics
images_generated = Counter('images_generated_total', 'Total images generated')
images_failed = Counter('images_failed_total', 'Total images failed')
queue_size = Gauge('queue_pending_size', 'Pending queue size')
generation_time = Histogram('image_generation_seconds', 'Image generation time')
api_key_available = Gauge('api_keys_available', 'Available API keys', ['model'])
```

### Fix 3.2: Add Dead Letter Queue

```python
# Tasks that fail permanently go here for analysis
DEAD_LETTER_KEY = "image_queue:dead_letter"

def mark_failed(self, task_id: str, error: str, ...):
    if permanent or task.retry_count >= MAX_RETRIES:
        # Move to dead letter queue instead of just failed set
        self.redis.zadd(self.DEAD_LETTER_KEY, {task_id: time.time()})
        # Keep task data for analysis
        self.redis.expire(task_key, 604800)  # 7 days for dead letters
```

### Fix 3.3: Add Distributed Locking

```python
import redis.lock

def get_batch(self, limit: int = BATCH_SIZE) -> List[ImageTask]:
    # Use Redis lock for distributed safety
    lock = self.redis.lock("queue:batch_lock", timeout=30)

    if lock.acquire(blocking=True, blocking_timeout=5):
        try:
            return self._get_batch_internal(limit)
        finally:
            lock.release()
    else:
        logger.warning("Could not acquire batch lock")
        return []
```

---

## Implementation Order

| Priority | Fix | Effort | Impact |
|----------|-----|--------|--------|
| 1 | 1.1 Auto-cleanup stale tasks | 2h | High - stops manual intervention |
| 2 | 1.2 Free tier vs rate limit | 1h | High - stops bad key retries |
| 3 | 1.5 Redis TTL | 30m | High - prevents data growth |
| 4 | 1.3 Circuit breaker | 1h | Medium - prevents API hammering |
| 5 | 1.4 Health endpoint | 1h | Medium - enables monitoring |
| 6 | 2.3 Config file | 1h | Medium - easier management |
| 7 | 2.1 Split long functions | 2h | Low - maintainability |
| 8 | 2.2 Fix bare except | 1h | Low - better debugging |

**Total Phase 1:** ~6 hours
**Total Phase 2:** ~4 hours

---

## Testing Plan

### After Phase 1:
1. Start fresh batch - verify no manual cleanup needed
2. Test with bad API key - verify it's marked as free_tier and skipped
3. Kill Redis - verify health endpoint shows unhealthy
4. Wait 24h - verify old tasks auto-expire from Redis
5. Exhaust all keys - verify circuit breaker opens after 3 failures

### After Phase 2:
1. Check logs - verify no bare exception warnings
2. Change env vars - verify config values update
3. Code review - verify functions are <50 lines

---

## Rollback Plan

All changes are additive. To rollback:
1. Revert git commit
2. Restart services
3. Redis data is unaffected (new keys just won't be used)
