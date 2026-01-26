# Manual End-to-End Test Guide

**Version:** 1.0
**Last Updated:** 2026-01-26
**Target Environment:** Production (http://31.97.123.84)

---

## Prerequisites

Before running tests:

1. **SSH Access:** `ssh root@31.97.123.84`
2. **Monitor Logs:** `journalctl -u tiktok-slideshow -f` (in separate terminal)
3. **Monitor Redis Queue:** `redis-cli -n 1 ZCARD image_queue:pending`
4. **UI Access:** Open http://31.97.123.84 in browser

---

## Test Categories

| # | Test Category | Risk Level | Priority |
|---|--------------|------------|----------|
| 1 | Single Job Generation | Low | High |
| 2 | Batch Job Processing | Medium | High |
| 3 | Job Deletion During Processing | High | Critical |
| 4 | Concurrent Batch Runs | High | Critical |
| 5 | Video Queue Processing | Medium | High |
| 6 | Service Recovery | High | Critical |

---

## TEST 1: Single Job Generation

### Purpose
Verify single TikTok URL processing works correctly with all photo and text variations.

### Test Data
```
URL: https://www.tiktok.com/@tomahawk_tbell/photo/7341025475910733099
```

### Steps

1. **Start Test**
   - Open http://31.97.123.84
   - Paste the TikTok URL
   - Upload 1 product image
   - Select any preset (e.g., "Classic Shadow")
   - Click "Generate"

2. **Monitor Progress**
   - Note the `session_id` from the status response
   - Watch logs: `journalctl -u tiktok-slideshow -f | grep <session_id>`
   - Check image queue: `redis-cli -n 1 ZCARD image_queue:pending`

3. **Verify Image Generation**
   - All images should appear in the generated folder
   - Check for hook, body, and product slides
   - Verify persona consistency across variations

4. **Verify Video Generation**
   - Videos should be created after images complete
   - Check video queue: `SELECT * FROM video_jobs WHERE status='pending';`

### Expected Results

| Step | Expected Result | How to Verify |
|------|-----------------|---------------|
| Job Created | Status returns `session_id` | API response |
| Scraping | Photos downloaded from TikTok | Logs show "Scraped X images" |
| Image Queue | Tasks submitted to Redis | `redis-cli -n 1 ZCARD image_queue:pending` > 0 |
| Image Generation | 18 images per 60s batch | Logs show "Batch complete: X succeeded" |
| Product Slides | All variations have product images | Check generated folder |
| Video Creation | Videos created for each variation | Logs show "Video uploaded" |
| Final Status | Job status = "completed" | API `/api/status/<session_id>` |

### Variations to Verify

For a typical single job with 2 photo variations and 2 text variations:
- `slideshow_p1_t1.mp4` - Photo variation 1, Text variation 1
- `slideshow_p1_t2.mp4` - Photo variation 1, Text variation 2
- `slideshow_p2_t1.mp4` - Photo variation 2, Text variation 1
- `slideshow_p2_t2.mp4` - Photo variation 2, Text variation 2

**Critical Check:** All 4 videos MUST contain product images.

---

## TEST 2: Batch Job Processing

### Purpose
Verify batch processing of multiple TikTok URLs.

### Test Data
```
URLs (use 3-5 links):
https://www.tiktok.com/@tomahawk_tbell/photo/7341025475910733099
https://www.tiktok.com/@kayls_1989/photo/7444862923127737633
https://www.tiktok.com/@555keeks/photo/7524451650350746910
```

### Steps

1. **Create Batch**
   ```bash
   curl -X POST http://31.97.123.84/api/batch \
     -H "Content-Type: application/json" \
     -d '{
       "links": [
         "https://www.tiktok.com/@tomahawk_tbell/photo/7341025475910733099",
         "https://www.tiktok.com/@kayls_1989/photo/7444862923127737633"
       ],
       "preset_id": "classic_shadow"
     }'
   ```
   - Note the returned `batch_id`

2. **Monitor Batch Status**
   ```bash
   curl http://31.97.123.84/api/batch/<batch_id>
   ```

3. **Check Celery Worker**
   ```bash
   journalctl -u celery-worker -f
   ```

4. **Verify Each Link**
   - Each link should process sequentially
   - Check status transitions: pending → processing → completed

### Expected Results

| Metric | Expected |
|--------|----------|
| Batch Status | "processing" → "completed" |
| Links Processed | All links reach "completed" or "failed" |
| Images Per Link | All variations generated |
| Videos Per Link | All slideshow videos created |
| Error Handling | Failed links don't block others |

### Verification Commands

```bash
# Check batch status
curl http://31.97.123.84/api/batch/<batch_id>

# Check individual link status
curl http://31.97.123.84/api/batch/<batch_id>/links

# Check Celery task queue
redis-cli -n 0 LLEN celery

# Check image queue
redis-cli -n 1 ZCARD image_queue:pending
```

---

## TEST 3: Job Deletion During Processing (CRITICAL)

### Purpose
Verify that deleting a job while it's processing:
1. Properly revokes Celery tasks
2. Cleans up Redis queue
3. Does NOT cause worker reconnection issues
4. Does NOT leave orphaned tasks

### Risk
**HIGH** - This has historically caused Redis worker reconnection loops.

### Steps

1. **Start a Single Job**
   - Use the UI to start a job with a TikTok URL
   - Wait until you see "processing" status

2. **Verify Job is In Queue**
   ```bash
   # Check Redis queue has tasks
   redis-cli -n 1 ZCARD image_queue:pending

   # Check processing tasks
   redis-cli -n 1 SCARD image_queue:processing
   ```

3. **Delete the Job (While Processing)**
   ```bash
   curl -X DELETE http://31.97.123.84/api/jobs/<job_id>
   ```

4. **IMMEDIATELY Monitor Services**
   ```bash
   # Terminal 1: Watch Celery worker
   journalctl -u celery-worker -f

   # Terminal 2: Watch image queue processor
   journalctl -u image-queue-processor -f

   # Terminal 3: Check Redis connections
   redis-cli CLIENT LIST | grep -c "celery\|queue"
   ```

5. **Check for Reconnection Loop**
   - Watch logs for repeated "Connection lost" / "Reconnecting" messages
   - If you see more than 2 reconnection attempts in 30 seconds, **TEST FAILED**

### Expected Results

| Step | Expected | FAILURE Indicator |
|------|----------|-------------------|
| Delete Response | `{"status": "deleted", "tasks_revoked": N}` | Error response |
| Celery Logs | "Revoked task: <id>" messages | "Connection refused" errors |
| Queue Processor | Continues processing other tasks | Crashes or hangs |
| Redis Queue | Job tasks removed | Orphaned tasks remain |
| Worker Stability | Workers stay running | Reconnection loop (>2 attempts) |

### Post-Test Verification

```bash
# Check no orphaned tasks for deleted job
redis-cli -n 1 KEYS "image_queue:job:<job_id>*"
# Should return empty

# Check workers are healthy
systemctl status celery-worker image-queue-processor

# Check Redis connections stable
redis-cli CLIENT LIST | wc -l
# Should be stable (not increasing)
```

---

## TEST 4: Concurrent Batch Runs (CRITICAL)

### Purpose
Verify system handles multiple simultaneous batch jobs correctly:
1. Queue maintains FIFO order
2. No race conditions
3. All jobs eventually complete
4. System remains stable under load

### Test Data
Prepare 3 separate batch requests with different URLs.

### Steps

1. **Create Multiple Batches Simultaneously**

   Open 3 terminal windows and run simultaneously:

   ```bash
   # Terminal 1 - Batch A
   curl -X POST http://31.97.123.84/api/batch \
     -H "Content-Type: application/json" \
     -d '{"links": ["https://www.tiktok.com/@user1/photo/123"], "preset_id": "classic_shadow"}'

   # Terminal 2 - Batch B
   curl -X POST http://31.97.123.84/api/batch \
     -H "Content-Type: application/json" \
     -d '{"links": ["https://www.tiktok.com/@user2/photo/456"], "preset_id": "elegance_shadow"}'

   # Terminal 3 - Batch C
   curl -X POST http://31.97.123.84/api/batch \
     -H "Content-Type: application/json" \
     -d '{"links": ["https://www.tiktok.com/@user3/photo/789"], "preset_id": "modern_shadow"}'
   ```

2. **Monitor Queue Growth**
   ```bash
   watch -n 2 'redis-cli -n 1 ZCARD image_queue:pending'
   ```

3. **Monitor Batch Statuses**
   ```bash
   # Check all batch statuses
   curl http://31.97.123.84/api/batch
   ```

4. **Verify Resource Usage**
   ```bash
   # On server
   htop  # Watch CPU and memory

   # Check Redis memory
   redis-cli INFO memory | grep used_memory_human
   ```

5. **Wait for Completion**
   - All batches should eventually reach "completed"
   - Note total time taken

### Expected Results

| Metric | Expected | FAILURE Indicator |
|--------|----------|-------------------|
| All Batches Created | 3 batch IDs returned | Any request fails |
| Queue Order | FIFO maintained | Tasks processed out of order |
| Worker Stability | No crashes | Worker restarts in logs |
| Memory Usage | <500MB | Memory keeps growing |
| All Complete | All batches reach "completed" | Any stuck in "processing" |
| No Data Corruption | Each batch has correct images | Wrong images in folders |

### Stress Test Variant

For higher load testing:
```bash
# Create 5 batches with 3 links each (15 total jobs)
for i in {1..5}; do
  curl -X POST http://31.97.123.84/api/batch \
    -H "Content-Type: application/json" \
    -d "{\"links\": [\"URL1\", \"URL2\", \"URL3\"], \"preset_id\": \"classic_shadow\"}" &
done
wait
```

---

## TEST 5: Video Queue Processing

### Purpose
Verify video generation queue works correctly:
1. Videos created after images complete
2. Multiple videos processed in order
3. Failed videos don't block queue
4. Google Drive upload works

### Steps

1. **Generate a Job with Multiple Variations**
   - Start a single job that will produce 4+ videos
   - Use 2 photo variations, 2 text variations

2. **Monitor Video Queue**
   ```bash
   # Check pending video jobs
   sqlite3 /root/tiktok-slideshow-generator/Desktop/tiktok/backend/batch_processing.db \
     "SELECT id, status, variation_key FROM video_jobs ORDER BY created_at DESC LIMIT 10;"
   ```

3. **Check Video Worker**
   ```bash
   journalctl -u tiktok-slideshow -f | grep -i "video"
   ```

4. **Verify Output**
   - Each variation should have a video
   - Videos should be uploaded to Google Drive
   - Drive links should be valid

### Expected Results

| Step | Expected |
|------|----------|
| Video Jobs Created | 1 job per variation |
| Processing Order | FIFO (oldest first) |
| Upload Success | Drive URL in job record |
| All Videos | All variations have videos |

### Video Job Status Check

```bash
# Count by status
sqlite3 batch_processing.db "SELECT status, COUNT(*) FROM video_jobs GROUP BY status;"

# Check recent failures
sqlite3 batch_processing.db "SELECT id, error_message FROM video_jobs WHERE status='failed' ORDER BY created_at DESC LIMIT 5;"
```

---

## TEST 6: Service Recovery (CRITICAL)

### Purpose
Verify system recovers correctly after service restart:
1. In-progress jobs resume or fail gracefully
2. Queue state preserved
3. Workers reconnect properly

### Steps

1. **Start a Large Batch**
   - Create batch with 5+ links
   - Wait until processing

2. **Restart Services (One at a Time)**

   **Test A: Restart Celery Worker**
   ```bash
   systemctl restart celery-worker
   # Wait 30 seconds
   systemctl status celery-worker
   ```

   **Test B: Restart Image Queue Processor**
   ```bash
   systemctl restart image-queue-processor
   # Wait 30 seconds
   systemctl status image-queue-processor
   ```

   **Test C: Restart Main App**
   ```bash
   systemctl restart tiktok-slideshow
   # Wait 30 seconds
   systemctl status tiktok-slideshow
   ```

3. **Verify Recovery**
   - Check each service is running
   - Check batch continues processing
   - Check no duplicate work

### Expected Results

| Restart | Expected Recovery |
|---------|-------------------|
| Celery Worker | Resumes tasks, no duplicates |
| Queue Processor | Continues from last batch |
| Main App | API responds, jobs continue |
| Full Restart | All services recover, queue resumes |

### Verification After Each Restart

```bash
# All services running
systemctl status tiktok-slideshow celery-worker image-queue-processor | grep Active

# Queue has correct state
redis-cli -n 1 ZCARD image_queue:pending
redis-cli -n 1 SCARD image_queue:processing

# Batch still processing
curl http://31.97.123.84/api/batch/<batch_id>
```

---

## Quick Reference: Key Commands

### Service Management
```bash
# View all service statuses
systemctl status tiktok-slideshow celery-worker image-queue-processor redis

# Restart all services
systemctl restart tiktok-slideshow celery-worker image-queue-processor

# View logs
journalctl -u tiktok-slideshow -f
journalctl -u celery-worker -f
journalctl -u image-queue-processor -f
```

### Redis Queue Inspection
```bash
# Connect to image queue DB (DB 1)
redis-cli -n 1

# Queue sizes
ZCARD image_queue:pending      # Pending tasks
SCARD image_queue:processing   # Currently processing
ZCARD image_queue:retry        # Retry queue
SCARD image_queue:completed    # Completed
SCARD image_queue:failed       # Failed

# Get pending tasks (first 10)
ZRANGE image_queue:pending 0 9

# Check specific job status
HGETALL image_queue:job_status:<job_id>
```

### Database Inspection
```bash
# Connect to SQLite
sqlite3 /root/tiktok-slideshow-generator/Desktop/tiktok/backend/batch_processing.db

# Useful queries
SELECT id, status, preset_id, created_at FROM batches ORDER BY created_at DESC LIMIT 5;
SELECT id, status, url FROM batch_links WHERE batch_id='<id>';
SELECT status, COUNT(*) FROM video_jobs GROUP BY status;
```

### Health Checks
```bash
# API Health
curl http://31.97.123.84/api/health

# Queue Stats
curl http://31.97.123.84/api/queue/stats

# Disk Space
df -h /

# Memory
free -h
```

---

## Test Result Template

Use this template to record test results:

```
Test: [Test Name]
Date: [YYYY-MM-DD HH:MM]
Tester: [Name]

Environment:
- Server: production / staging
- Commit: [git rev-parse HEAD]

Steps Executed:
1. [ ] Step 1 - Result
2. [ ] Step 2 - Result
...

Issues Found:
- None / Description of issues

Result: PASS / FAIL

Notes:
[Additional observations]
```

---

## Known Issues & Workarounds

### Issue 1: Redis Reconnection Loop on Job Delete
**Symptom:** Worker repeatedly reconnects after deleting job
**Workaround:** Wait for job to complete before deleting, or restart workers
**Status:** Needs investigation

### Issue 2: Stuck Processing Jobs
**Symptom:** Job stuck in "processing" forever
**Workaround:** Run cleanup script: `python cleanup_stuck_jobs.py --action=fail`
**Prevention:** Ensure workers are running before starting jobs

### Issue 3: Missing Product Slides in p2 Variations
**Symptom:** slideshow_p2_* videos missing product images
**Status:** FIXED in commit d83b095 (deployed 2026-01-26)

---

## Appendix: TikTok Test URLs

Verified working URLs for testing:

```
# Single image posts
https://www.tiktok.com/@tomahawk_tbell/photo/7341025475910733099
https://www.tiktok.com/@kayls_1989/photo/7444862923127737633
https://www.tiktok.com/@555keeks/photo/7524451650350746910

# Multi-image slideshows
[Add verified slideshow URLs here]
```

---

*Document created by Claude Code - Update after each test cycle*
