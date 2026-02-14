# PRD: Instagram Reel Generator

## 1. Introduction/Overview

Jenny currently creates Instagram reels manually: she generates AI personas in Higgsfield, produces before/after photos and 5-second video clips, downloads viral Instagram audio, and manually combines everything in CapCut. This process works but is extremely time-consuming when producing hundreds of video variations.

The Instagram Reel Generator automates the **assembly** step. Users upload their assets (before/after photos and video clips), paste an Instagram reel link as a format reference, and the system generates dozens of unique videos by combining different assets with text variations and the reference audio.

**This is NOT an AI generation tool. It's a video editing automation tool.**

---

## 2. Goals

1. Reduce manual CapCut editing from hours to minutes
2. Generate 10-50 unique reel variations per batch from a single set of assets
3. Match the structure/timing of viral Instagram reels automatically
4. Support both photo (static) and video clip assets
5. Deliver finished videos to Google Drive

---

## 3. User Stories

1. **As a user**, I want to paste an Instagram reel link so the system can extract the audio and detect the video format (how many clips, how long each clip is).

2. **As a user**, I want to upload my before/after photos and video clips into organized folders so the system knows which assets to use.

3. **As a user**, I want to type hook text and CTA text, and optionally request AI-generated text variations, so each video has unique copy.

4. **As a user**, I want to choose how many videos to generate, whether to use photos/videos/both, so I control the output.

5. **As a user**, I want the system to save the IG reel format as a reusable template so I don't need to re-scrape the same link.

6. **As a user**, I want all generated videos uploaded to my Google Drive folder so I can download and post them.

---

## 4. Functional Requirements

### 4.1 Instagram Reel Scraper

1. User pastes an Instagram reel URL
2. System downloads the reel video and extracts:
   - Audio track (the viral sound)
   - Total duration
   - Number of clips/scenes (via scene detection)
   - Duration of each clip
3. System saves this as a **format template** with a user-provided name
4. Format templates are reusable — user can select from previously scraped formats

### 4.2 Asset Management

5. User uploads assets organized by **character** (AI persona). Each character has 4 subfolders:
   - **Before Photos** (static images)
   - **After Photos** (static images)
   - **Before Videos** (5-second clips)
   - **After Videos** (5-second clips)
6. User creates a character by giving it a name (e.g., "jessica_30s_brunette") — this keeps before/after pairs matched to the same persona
7. Assets are stored on the server and persist between sessions
8. User can view, delete, and add assets to their library
9. Supported formats: JPG, PNG, WEBP for photos; MP4, MOV for videos
10. When generating videos, the system only pairs before/after assets from the SAME character

### 4.3 Text System

9. User provides text for each clip position in the format:
   - **Clip 1 (hook)**: Main text — white text, black background (e.g., "POV: you lose face fat")
   - **Clip 2 (CTA)**: Call-to-action — black text, white background + ⬇️ emoji (e.g., "see how I did it ⬇️")
10. Text position: bottom of frame (default), optionally top
11. **Text variations**: User specifies how many text variations (1-10). If more than 1, system uses **Claude AI** (not Gemini) to generate variations of the user's base text while keeping the same meaning/style. Claude is used here because it produces better copywriting — more natural, punchier, better tone for social media hooks
12. Text is rendered ON TOP of the video/photo, not baked into generation

### 4.4 Video Generation Engine

13. User selects:
    - A format template (from saved templates)
    - Asset type: photos only, videos only, or both
    - Number of videos to generate (1-50)
    - Number of text variations (1-10)
14. System generates videos by creating unique combinations:
    - Different before assets + different after assets + different text variations
    - No duplicate combinations
15. Each video follows the format template:
    - Same number of clips as the reference reel
    - Same duration per clip as the reference
    - Audio from the reference reel
    - Text overlaid per the text configuration
16. Video output: 9:16 ratio (1080x1920), MP4
17. Photo assets are displayed as static frames for the clip duration (scaled/padded to 1080x1920)
18. **Aspect ratio handling**: If source assets are 3:4, scaling to 9:16 would leave black bars. System uses **blurred background padding** (same as existing slideshow-to-video) — image centered at full height, empty space filled with blurred/zoomed version of the same image
19. Video clip assets are trimmed/looped to match the clip duration

### 4.5 Video Assembly (FFmpeg)

19. For each generated video:
    - Concatenate clips (before + after, or more depending on format)
    - Overlay text on each clip according to text configuration
    - Mix in the audio track from the IG reel
    - Set exact duration to match format template
    - Output as MP4 with H.264 video + AAC audio
20. Text rendering uses the same approach as existing slideshow text presets:
    - Hook text: white text, black semi-transparent background, bottom position
    - CTA text: black text, white background, bottom position, includes ⬇️

### 4.6 Output & Google Drive

21. All generated videos are uploaded to a Google Drive folder
22. Folder is auto-named with format name + timestamp (e.g., "face-fat-reel-2026-02-05")
23. User receives a Drive folder link when batch is complete

### 4.7 UI (Separate Page)

24. New page at `/instagram-reel` (separate from slideshow and tiktok-copy)
25. Same password protection as other pages
26. UI flow:
    - **Step 1: Format** — Paste IG link to scrape OR select existing template
    - **Step 2: Assets** — Upload/manage before and after photos/videos
    - **Step 3: Text** — Enter hook text + CTA text, choose number of variations
    - **Step 4: Generate** — Choose number of videos, photo/video/both, submit
    - **Step 5: Progress** — Show generation progress, Drive link when done
27. Admin page shows IG Reel Generator jobs (same pattern as TikTok Copy monitoring)

---

## 5. Non-Goals (Out of Scope)

- **Picture-in-picture format** — skip for v1, can add later
- **Auto persona generation** — user provides all assets
- **Beat sync to music** — clips follow fixed durations from format, not beat-matched
- **Transitions between clips** — hard cuts only for v1
- **More than 5 format templates** — start with 5, add more as paid follow-up
- **Automatic before/after detection** — user manually categorizes assets

---

## 6. Design Considerations

### Text Styles (2 types)

**Hook text (Clip 1):**
```
┌──────────────────────┐
│                      │
│    [video/photo]     │
│                      │
│  ┌──────────────┐    │
│  │ POV: you     │    │  ← white text, black semi-transparent bg
│  │ lose face fat│    │
│  └──────────────┘    │
└──────────────────────┘
```

**CTA text (Clip 2):**
```
┌──────────────────────┐
│                      │
│    [video/photo]     │
│                      │
│  ┌──────────────┐    │
│  │see how I did │    │  ← black text, white bg
│  │   it ⬇️      │    │
│  └──────────────┘    │
└──────────────────────┘
```

### UI Style
- Same dark theme as existing pages (Tailwind + Alpine.js)
- Step-by-step wizard flow
- Asset upload with drag & drop and thumbnails

---

## 7. Technical Considerations

### Dependencies
- **Instagram scraper**: Need a method to download IG reels (yt-dlp, instaloader, or RapidAPI)
- **Scene detection**: FFmpeg scene detection filter (`select='gt(scene,0.3)'`) to detect clip boundaries
- **FFmpeg**: Video assembly, text overlay via drawtext filter
- **Claude API**: Text variation generation (better copywriting quality than Gemini)
- **Gemini API**: Clip analysis only (visual understanding)
- **Google Drive API**: Same integration as existing

### Architecture
- New Blueprint: `instagram_reel_bp` at `/api/instagram-reel/`
- New Celery tasks for batch video generation
- New database tables: `ig_formats`, `ig_assets`, `ig_reel_batches`, `ig_reel_jobs`
- Asset storage: `/backend/temp/ig_assets/{character_name}/` (before_photos, after_photos, before_videos, after_videos)

### Key Technical Risks
1. **IG scraping reliability** — Instagram blocks scrapers frequently. Need fallback (RapidAPI or manual upload of reference video)
2. **Scene detection accuracy** — FFmpeg scene detect may not perfectly detect cuts. Allow user to manually adjust clip durations after scrape
3. **Text rendering quality** — FFmpeg drawtext is limited. May need Pillow for styled text + overlay as image

---

## 8. Success Metrics

1. User can generate 10+ unique video variations from a single IG reference in under 5 minutes
2. Generated videos match the timing/structure of the reference reel
3. Text overlays are clean and readable (match the 2 required styles)
4. All videos successfully upload to Google Drive
5. System handles 50-video batches without failures

---

## 9. Open Questions

1. **IG scraping method**: Use yt-dlp (free but may break) or RapidAPI (costs per request but reliable)? Or support both with fallback?
2. **Asset persistence**: Should assets persist permanently per user, or per session? (Currently no user accounts — use session-based with optional Drive backup?)
3. **Format template editing**: After scraping an IG reel, should user be able to manually adjust clip durations before saving the template?
4. **Audio**: Always use audio from IG reference? Or allow user to upload their own audio file?
5. **Clip assignment**: In formats with 3+ clips, how does user specify which clips are "before" and which are "after"? (e.g., clip 1 = before, clip 2 = after, clip 3 = CTA photo?)
