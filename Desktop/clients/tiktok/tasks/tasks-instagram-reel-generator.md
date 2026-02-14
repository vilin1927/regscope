# Tasks: Instagram Reel Generator

## Resolved Open Questions

| # | Question | Decision |
|---|----------|----------|
| 1 | IG scraping method | yt-dlp |
| 2 | Asset persistence | Permanent, no limits, single user (Jenny) |
| 3 | Template editing after scrape | Yes — user can adjust clip durations/types |
| 4 | Audio source | Both — IG extraction + custom upload |
| 5 | Clip assignment (3+ clips) | AI auto-detect (Gemini) + manual override |

---

## Phase 1: Database & Core Models

### Task 1.1: Create database tables and helpers
**File:** `backend/database.py`

Add 4 new tables:

**`ig_formats`** — saved format templates
- `id` TEXT PK
- `format_name` TEXT NOT NULL
- `instagram_url` TEXT (nullable — custom formats won't have one)
- `audio_path` TEXT
- `total_duration` FLOAT
- `clips_json` TEXT — JSON array: `[{"index": 0, "duration": 2.5, "type": "before", "text_position": "bottom"}, ...]`
- `created_at` TIMESTAMP

**`ig_characters`** — asset groups (personas)
- `id` TEXT PK
- `character_name` TEXT UNIQUE NOT NULL
- `created_at` TIMESTAMP

**`ig_assets`** — individual files linked to characters
- `id` TEXT PK
- `character_id` TEXT FK → ig_characters
- `asset_type` TEXT — `before_photo`, `after_photo`, `before_video`, `after_video`
- `file_path` TEXT
- `original_filename` TEXT
- `created_at` TIMESTAMP

**`ig_jobs`** — batch generation jobs
- `id` TEXT PK
- `format_id` TEXT FK → ig_formats
- `status` TEXT DEFAULT 'pending' — pending/processing/completed/failed
- `num_videos` INTEGER
- `num_text_variations` INTEGER
- `asset_type` TEXT — photos/videos/both
- `hook_text` TEXT
- `cta_text` TEXT
- `text_variations_json` TEXT — generated variations from Claude
- `drive_folder_url` TEXT
- `error_message` TEXT
- `videos_completed` INTEGER DEFAULT 0
- `videos_failed` INTEGER DEFAULT 0
- `created_at` TIMESTAMP
- `started_at` TIMESTAMP
- `completed_at` TIMESTAMP

**`ig_videos`** — individual videos within a job
- `id` TEXT PK
- `job_id` TEXT FK → ig_jobs
- `video_number` INTEGER
- `character_id` TEXT
- `before_asset_id` TEXT
- `after_asset_id` TEXT
- `text_variation_index` INTEGER
- `output_path` TEXT
- `drive_url` TEXT
- `status` TEXT DEFAULT 'pending'
- `error_message` TEXT
- `created_at` TIMESTAMP

**Helper functions to add:**
- `create_ig_format()`, `get_ig_format()`, `list_ig_formats()`, `update_ig_format()`
- `create_ig_character()`, `get_ig_character()`, `list_ig_characters()`, `delete_ig_character()`
- `create_ig_asset()`, `get_ig_assets_by_character()`, `delete_ig_asset()`
- `create_ig_job()`, `get_ig_job()`, `list_ig_jobs()`, `update_ig_job_status()`
- `create_ig_video()`, `get_ig_videos_by_job()`, `update_ig_video_status()`

**Acceptance:** Tables created on app startup via `init_db()`. All CRUD helpers work.

---

## Phase 2: Instagram Scraper & Format Extraction

### Task 2.1: Create Instagram scraper
**File:** `backend/instagram_scraper.py` (new, ~200 lines)

Functions:
- `download_reel(url: str, output_dir: str) -> str` — uses yt-dlp to download IG reel video, returns file path
- `extract_audio(video_path: str, output_path: str) -> str` — FFmpeg extracts audio track to MP3/AAC
- `detect_scene_cuts(video_path: str, threshold: float = 0.4) -> list[float]` — FFmpeg scene detection, returns list of cut timestamps
- `extract_clip_screenshots(video_path: str, cuts: list[float]) -> list[str]` — extracts one frame from the middle of each clip for Gemini analysis
- `get_video_duration(video_path: str) -> float` — FFprobe to get total duration

**Dependencies:** yt-dlp, ffmpeg, ffprobe (all already on VPS)

**Acceptance:** Can download a real IG reel, extract audio, detect cuts, save screenshots.

### Task 2.2: Gemini clip analysis
**File:** `backend/instagram_scraper.py` (add to same file)

Function:
- `analyze_clips_with_gemini(screenshots: list[str], api_key_manager) -> list[dict]`
  - Sends screenshots to Gemini text model
  - Prompt: "For each screenshot from an Instagram reel clip, identify: type (before/after/cta/transition), any text visible, text position (top/center/bottom)"
  - Returns: `[{"index": 0, "type": "before", "detected_text": "POV: ...", "text_position": "bottom"}, ...]`
  - Uses existing `api_key_manager` for key rotation

**Acceptance:** Gemini correctly identifies clip types for sample reels.

### Task 2.3: Full scrape-to-template pipeline
**File:** `backend/instagram_scraper.py`

Function:
- `scrape_and_create_format(url: str, format_name: str, api_key_manager) -> dict`
  - Orchestrates: download → extract audio → detect cuts → screenshot clips → Gemini analyze → build template dict
  - Returns full format template ready to save to DB

**Acceptance:** End-to-end: paste URL → get complete format template with audio file + clip structure.

---

## Phase 3: Asset Management

### Task 3.1: Asset upload and management endpoints
**File:** `backend/instagram_reel_routes.py` (new, start here)

Blueprint: `ig_reel_bp = Blueprint('instagram_reel', __name__, url_prefix='/api/instagram-reel')`

Endpoints:
- `POST /characters` — create a new character (name only)
- `GET /characters` — list all characters with asset counts
- `DELETE /characters/<id>` — delete character + all its assets from disk
- `POST /characters/<id>/assets` — upload files (multipart), specify `asset_type`
- `GET /characters/<id>/assets` — list assets for character, grouped by type
- `DELETE /assets/<id>` — delete single asset from disk + DB

**Storage:** `/backend/temp/ig_assets/{character_name}/{asset_type}/filename.ext`

**Acceptance:** Can create characters, upload before/after photos and videos, list them, delete them. Files persist on disk.

---

## Phase 4: Format Template Management

### Task 4.1: Format scrape and management endpoints
**File:** `backend/instagram_reel_routes.py` (add to blueprint)

Endpoints:
- `POST /formats/scrape` — accepts `{url, format_name}`, triggers scrape pipeline (sync or async via Celery)
- `GET /formats` — list all saved format templates
- `GET /formats/<id>` — get single format with full clip details
- `PUT /formats/<id>` — update format (edit clip durations, types, reorder) — this is the manual override
- `DELETE /formats/<id>` — delete format + audio file
- `POST /formats/<id>/audio` — upload custom audio file (replaces extracted audio)

**Acceptance:** Can scrape an IG reel into a template, edit clip structure, upload custom audio, list/delete templates.

---

## Phase 5: Text Variation Generation

### Task 5.1: Claude text variation service
**File:** `backend/text_variation_service.py` (new, ~100 lines)

Function:
- `generate_text_variations(base_text: str, num_variations: int, text_type: str = 'hook') -> list[str]`
  - Calls Claude API (not Gemini) to generate variations of hook/CTA text
  - Prompt: "Rewrite this Instagram reel hook text in {num} different ways. Keep the same meaning, same length, punchy social media style. Original: '{base_text}'"
  - Returns list of variation strings (includes original as first)
  - Uses `ANTHROPIC_API_KEY` from `.env`

**Acceptance:** Generates natural-sounding variations that maintain the original's meaning and social media tone.

---

## Phase 6: Video Assembly Engine

### Task 6.1: Reel video assembler
**File:** `backend/reel_video_generator.py` (new, ~400 lines)

Core function:
- `assemble_reel_video(clips_config, audio_path, output_path) -> str`
  - `clips_config`: list of `{"asset_path": str, "duration": float, "text": str|None, "text_style": "hook"|"cta"|None}`
  - For each clip:
    - **Photo asset**: scale to 1080x1920 with blurred background padding (reuse existing pattern from `video_generator.py`), display for clip duration
    - **Video asset**: scale to 9:16, trim or loop to match clip duration
    - **Text overlay**: render text on frame using appropriate style (hook = white on black semi-transparent, CTA = black on white)
  - Concatenate all clips
  - Mix in audio track (trim to total duration)
  - Output MP4 (H.264 + AAC, 1080x1920)

Helper functions:
- `prepare_photo_clip(photo_path, duration, output_path)` — photo → video clip with blurred bg padding
- `prepare_video_clip(video_path, target_duration, output_path)` — trim/loop video clip to target duration
- `render_text_overlay(video_path, text, style, position, output_path)` — FFmpeg drawtext or Pillow overlay
- `concat_clips_with_audio(clip_paths, audio_path, output_path)` — final assembly

**Acceptance:** Can assemble a multi-clip reel from mixed photo/video assets with text overlays and audio. Output matches reference reel timing.

### Task 6.2: Combination generator
**File:** `backend/reel_video_generator.py` (add to same file)

Function:
- `generate_combinations(format_template, characters, text_variations, num_videos, asset_type) -> list[dict]`
  - Creates unique combinations of: character + before_asset + after_asset + text_variation
  - Respects: before/after from SAME character, no duplicate combos, asset_type filter (photos/videos/both)
  - Returns list of video configs ready for assembly

**Acceptance:** Generates correct number of unique, valid combinations. Never mixes characters.

---

## Phase 7: Celery Tasks & Batch Processing

### Task 7.1: Instagram reel Celery tasks
**File:** `backend/instagram_reel_tasks.py` (new, ~300 lines)

Tasks:
- `scrape_format_task(url, format_name)` — async format scraping (wraps Task 2.3)
- `generate_reel_batch(job_id)` — orchestrator task:
  1. Load job config from DB
  2. Generate text variations (Claude) if needed
  3. Generate combinations
  4. Create Google Drive folder
  5. Dispatch individual video tasks via Celery group
  6. Finalize job when all complete (update DB, set Drive link)
- `generate_single_reel_video(job_id, video_id, video_config)` — generate one video:
  1. Apply image transforms for uniqueness
  2. Assemble video via reel_video_generator
  3. Upload to Drive
  4. Update video status in DB
  5. Increment job counter

**Error handling:** Follow existing pattern — `max_retries=3` for individual videos, `max_retries=0` for orchestrator. Failed videos don't block the batch.

**Acceptance:** Can queue a batch of 10+ videos, process in parallel (concurrency=2), upload to Drive, track progress.

### Task 7.2: Job creation endpoint
**File:** `backend/instagram_reel_routes.py` (add to blueprint)

Endpoints:
- `POST /generate` — create a new generation job:
  - Body: `{format_id, num_videos, num_text_variations, asset_type, hook_text, cta_text, character_ids[]}`
  - Validates inputs, creates ig_job + ig_video records
  - Dispatches `generate_reel_batch.delay(job_id)`
  - Returns `{job_id}`
- `GET /jobs` — list all jobs with status/progress
- `GET /jobs/<id>` — single job with video-level details
- `GET /jobs/<id>/status` — lightweight poll endpoint (progress counts only)

**Acceptance:** Can submit a generation job via API, poll progress, get Drive link on completion.

---

## Phase 8: Frontend

### Task 8.1: Instagram Reel page — shell + routing
**File:** `frontend/instagram-reel.html` (new)
**File:** `backend/app.py` (add route + blueprint registration)

- Create base HTML page with same dark theme as existing pages
- Password protection (same pattern as other pages)
- Alpine.js shell with 5-step wizard navigation
- Register `ig_reel_bp` blueprint in `app.py`
- Add route: `@app.route('/instagram-reel')` → serves the HTML

**Acceptance:** Page loads at `/instagram-reel`, password protected, step navigation works.

### Task 8.2: Step 1 — Format selection/scraping UI
- Paste IG URL + name → scrape button → loading state → shows extracted format
- OR select from saved templates dropdown
- Show clip structure visually: clip cards with duration, type, text position
- Edit mode: adjust clip durations (number inputs), reassign types (dropdown), reorder
- Upload custom audio button
- "Save & Continue" button

### Task 8.3: Step 2 — Asset management UI
- Create character: name input + create button
- Character list with expand/collapse
- Per character: 4 upload zones (before photos, after photos, before videos, after videos)
- Drag & drop file upload with thumbnails/previews
- Delete individual assets
- Delete entire character
- Asset count summary per character
- "Continue" button (requires at least 1 character with before + after assets)

### Task 8.4: Step 3 — Text configuration UI
- Hook text textarea
- CTA text textarea
- Number of text variations slider (1-10)
- Preview of text styles (mock of hook style + CTA style)
- "Continue" button

### Task 8.5: Step 4 — Generation config + submit
- Format template display (read-only summary)
- Asset type selector: photos / videos / both
- Number of videos slider (1-50)
- Character selection (which characters to include — checkboxes)
- Estimated combinations counter (live calculation)
- "Generate Videos" submit button

### Task 8.6: Step 5 — Progress tracking + results
- Job status polling (1s interval)
- Progress bar: X of Y videos completed
- Per-video status list (completed / processing / failed)
- Google Drive folder link when done
- "Generate More" button to restart

**Acceptance (all 8.x):** Full wizard flow works end-to-end. Upload assets → select format → configure text → generate → see progress → get Drive link.

---

## Phase 9: Admin Integration

### Task 9.1: Add IG Reel jobs to admin dashboard
**File:** `frontend/admin.html` (edit existing)
**File:** `backend/admin_routes.py` (add endpoints)

- New tab/section in admin for "IG Reel Jobs"
- Table: job ID, status, format name, video count, progress, created, Drive link
- Click to expand: individual video statuses
- Same pattern as existing TikTok Copy monitoring

**Acceptance:** Admin can see all IG reel jobs and their progress.

---

## Phase 10: Deploy & Test

### Task 10.1: Dependencies and deployment
- Add `yt-dlp` to requirements.txt (if not already)
- Add `anthropic` to requirements.txt (for Claude text variations)
- Verify FFmpeg version on VPS supports scene detection
- Create temp directories on VPS: `/backend/temp/ig_assets/`, `/backend/temp/ig_reels/`, `/backend/temp/ig_output/`
- Register new Celery tasks in worker config
- Deploy to VPS, restart services

### Task 10.2: End-to-end testing
- Test with 3+ real IG reel links from Jenny's list
- Test photo-only, video-only, and mixed batches
- Test 1 video, 10 videos, 50 videos
- Test text variation generation
- Test custom audio upload
- Test template editing (adjust clip durations)
- Verify Drive upload works
- Verify video quality (9:16, text readable, audio synced)

---

## Dependency Graph

```
Phase 1 (DB) → Phase 2 (Scraper) → Phase 4 (Format endpoints)
Phase 1 (DB) → Phase 3 (Asset mgmt)
Phase 1 (DB) → Phase 5 (Text variations)
Phase 2 + Phase 5 + Phase 6 → Phase 7 (Celery tasks)
Phase 3 + Phase 4 + Phase 7 → Phase 8 (Frontend)
Phase 7 → Phase 9 (Admin)
All → Phase 10 (Deploy)
```

## Estimated New Files

| File | Lines | Purpose |
|------|-------|---------|
| `backend/instagram_scraper.py` | ~300 | yt-dlp download, FFmpeg scene detection, Gemini analysis |
| `backend/text_variation_service.py` | ~100 | Claude API text variations |
| `backend/reel_video_generator.py` | ~400 | FFmpeg video assembly, combination generator |
| `backend/instagram_reel_tasks.py` | ~300 | Celery tasks for batch processing |
| `backend/instagram_reel_routes.py` | ~400 | Flask blueprint, all API endpoints |
| `frontend/instagram-reel.html` | ~600 | Full wizard UI |
| `backend/database.py` (additions) | ~200 | Tables + helpers |
| `backend/app.py` (additions) | ~10 | Blueprint registration + route |
| **Total** | **~2,300** | |
