# PRD: TikTok Slideshow Copy Tool

**Version:** 1.1
**Date:** 2026-02-04
**Status:** Approved
**Budget:** $80
**Timeline:** 1-2 days

---

## 1. Introduction/Overview

A tool that converts TikTok slideshow posts into downloadable MP4 videos with optional slide replacement. Users paste TikTok link(s), optionally upload a product photo and specify which slide to replace, then the system creates videos.

**Key Point:** No AI generation. This is video conversion + simple slide swap.

---

## 2. Goals

1. Convert any TikTok slideshow into a video file
2. Support batch processing (multiple links at once)
3. Allow replacing a specific slide with uploaded product photo
4. Output videos to Google Drive
5. Beautiful, intuitive UI on a separate page

---

## 3. User Stories

1. **As a user**, I want to paste TikTok links and get videos with original photos and audio.

2. **As a user**, I want to paste multiple TikTok links at once and get multiple videos.

3. **As a user**, I want to upload my product photo and specify which slide number to replace (e.g., replace slide 3 with my photo).

4. **As a user**, I want my videos uploaded to Google Drive automatically.

---

## 4. Functional Requirements

### 4.1 UI - New Page (`/tiktok-copy`)

1. **Clean, modern UI** with clear sections
2. **Input Section:**
   - Text area for pasting TikTok links (one per line)
   - Placeholder text: "Paste TikTok links here (one per line)"

3. **Slide Replacement Section (Optional):**
   - Toggle/checkbox: "Replace a slide with my product photo"
   - When enabled, show:
     - File upload for product photo (drag & drop + click)
     - Number input: "Which slide to replace?" (default: empty)
     - Helper text: "Enter slide number (e.g., 2 = replace 2nd slide)"

4. **Action Button:**
   - "Convert to Video" button (prominent, primary color)

5. **Progress Section:**
   - List of submitted links with status badges
   - Status: pending → processing → completed → failed
   - Show Google Drive link when completed

### 4.2 Input Processing

6. Accept TikTok slideshow URLs (validate format)
7. Support batch input (multiple links, one per line)
8. Support both URL formats:
   - `https://www.tiktok.com/@username/photo/123456`
   - `https://www.tiktok.com/t/ABC123/`
9. Validate slide number is positive integer (if provided)

### 4.3 Scraping

10. Use existing TikTok scraper (RapidAPI) to fetch:
    - All slideshow photos
    - Audio file
11. Save scraped content to temp directory

### 4.4 Slide Replacement

12. If slide replacement enabled AND slide number provided:
    - Replace photo at specified position with uploaded product photo
    - If slide number > total slides, append to end
13. If slide replacement disabled OR no slide number:
    - Use all original photos (no replacement)

### 4.5 Video Generation

14. Use FFmpeg to create video:
    - Resolution: 9:16 (1080x1920)
    - Each photo displays for **3 seconds**
    - No transitions (hard cut between photos)
    - Audio track from original TikTok
15. Output format: MP4 (H.264)

### 4.6 Output

16. Upload completed video to Google Drive
17. Create folder structure: `TikTok Copy / [date] / video_[id].mp4`
18. Return Google Drive link to user

### 4.7 Batch Processing

19. Process multiple links using existing Celery queue system
20. Same replacement settings apply to ALL links in batch
21. Show progress for each link (pending/processing/complete/failed)
22. Handle failures gracefully (one failure doesn't stop others)

---

## 5. Non-Goals (Out of Scope)

- **No AI image generation** - uses original TikTok photos or uploaded photo
- **No text overlays** - video has no added text
- **No auto-detection** of "amazon" slides - user specifies slide number manually
- **No custom duration** - fixed 3 seconds per photo
- **No transitions** - hard cuts only
- **No download button** - Google Drive only

---

## 6. UI Design Guidelines

Reference: Modern, clean design similar to existing slideshow generator.

### Layout
```
┌─────────────────────────────────────────────────┐
│  TikTok Copy Tool                               │
├─────────────────────────────────────────────────┤
│                                                 │
│  📋 Paste TikTok Links                          │
│  ┌─────────────────────────────────────────┐   │
│  │ https://tiktok.com/...                   │   │
│  │ https://tiktok.com/...                   │   │
│  │                                          │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  🔄 Replace Slide (Optional)          [Toggle]  │
│  ┌─────────────────────────────────────────┐   │
│  │  📷 Upload Product Photo                │   │
│  │  [Drag & drop or click]                 │   │
│  │                                          │   │
│  │  Slide #: [  2  ]                       │   │
│  │  "Replace slide 2 with your photo"      │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│         [ 🎬 Convert to Video ]                │
│                                                 │
├─────────────────────────────────────────────────┤
│  Progress                                       │
│  ┌─────────────────────────────────────────┐   │
│  │ ✅ tiktok.com/...123  [Open in Drive]   │   │
│  │ ⏳ tiktok.com/...456  Processing...     │   │
│  │ ⏸️ tiktok.com/...789  Pending           │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### Styling
- Use existing color scheme from slideshow generator
- Cards with subtle shadows
- Clear visual hierarchy
- Responsive (works on mobile)

---

## 7. Technical Considerations

### 7.1 Existing Infrastructure to Reuse

- TikTok scraper (`tiktok_scraper.py`) - already works
- Celery queue system - for batch processing
- Google Drive upload (`google_drive.py`)
- SQLite database for job tracking

### 7.2 New Components Needed

- FFmpeg video assembly function
- New Flask routes for `/tiktok-copy`
- New frontend page with file upload
- Product photo handling (save to temp, pass to worker)

### 7.3 FFmpeg Command (Reference)

```bash
ffmpeg -framerate 1/3 -i photo_%d.jpg -i audio.mp3 \
  -c:v libx264 -r 30 -pix_fmt yuv420p \
  -c:a aac -shortest \
  -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2" \
  output.mp4
```

### 7.4 Database Schema

```sql
CREATE TABLE tiktok_copy_jobs (
    id TEXT PRIMARY KEY,
    batch_id TEXT,                    -- Group jobs together
    tiktok_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending',    -- pending, processing, completed, failed
    replace_slide INTEGER,            -- Which slide to replace (NULL = no replacement)
    product_photo_path TEXT,          -- Path to uploaded product photo
    drive_url TEXT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);
```

### 7.5 API Endpoints

```
POST /api/tiktok-copy/convert
Body: {
  "links": ["url1", "url2", ...],
  "replace_slide": 2,           // Optional
  "product_photo": <file>       // Optional, multipart
}
Response: {
  "batch_id": "xxx",
  "jobs": [{"id": "...", "url": "...", "status": "pending"}, ...]
}

GET /api/tiktok-copy/status/<batch_id>
Response: {
  "batch_id": "xxx",
  "jobs": [{"id": "...", "url": "...", "status": "completed", "drive_url": "..."}, ...]
}
```

---

## 8. Success Metrics

1. User can paste 1-10 TikTok links and get videos within 5 minutes
2. Videos play correctly (proper aspect ratio, synced audio)
3. Slide replacement works accurately
4. 95%+ success rate for valid TikTok slideshow links

---

## 9. Open Questions

1. ~~Do we need batch processing?~~ **Yes - confirmed**
2. ~~Photo duration?~~ **3 seconds - confirmed**
3. ~~Slide replacement in scope?~~ **Yes - user specifies slide number**

---

## 10. File Structure

```
backend/
├── tiktok_copy_routes.py    # New Flask routes
├── tiktok_copy_service.py   # Video assembly logic
├── tasks.py                 # Add new Celery tasks

frontend/
├── tiktok-copy.html         # New page
```
