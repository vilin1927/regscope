# Fix Plan - February 1, 2026

## Issues to Fix (Priority Order)

---

### Issue 1: Nudity/Modesty
**Symptom:** Body slides showing too much skin (woman in bathtub)
**Root Cause:** No explicit modesty constraint in image generation prompts
**Fix Location:** `gemini_service_v2.py` - image generation prompts

**Fix:**
Add to ALL persona generation prompts:
```
MODESTY REQUIREMENT (CRITICAL):
- Person must ALWAYS be appropriately clothed
- NO revealing clothing, swimwear, towels-only, or suggestive poses
- Safe for all audiences - think "Instagram-appropriate"
- If scene involves water/bath, show person CLOTHED near water, not in it
```

**Test:** Generate body slide with bathroom/relaxation scene, verify clothed.

---

### Issue 2: Body Type Mismatch (Text says "slim waist" but persona isn't slim)
**Symptom:** Text says "Japanese women have tiny waists" but generated woman isn't slim
**Root Cause:** `body_type` randomly selected, ignores text content
**Fix Location:** `persona_components.py` + analysis prompt

**Fix Options:**
A. Add body type to analysis output (detect from text)
B. Add TEXT-VISUAL MATCH rule for body attributes
C. Both

**Recommended:** Option B - Add to TEXT-VISUAL MATCH:
```
TEXT-VISUAL MATCH (EXPANDED):
- If text mentions "slim", "tiny waist", "thin" → generate slim body type
- If text mentions "curvy", "thick" → generate curvy body type
- Match the body description in the text content
```

**Test:** Generate with "tiny waist" text, verify slim persona.

---

### Issue 3: Gibberish Text Generated
**Symptom:** Text shows "moody linking, reduced to glow from toid natural in mourel state"
**Root Cause:** AI hallucinating or corrupting text content during generation
**Investigation Needed:**
1. Check if text_content passed correctly to generation
2. Check if Gemini is inventing text instead of using provided text
3. Check logging for what text_content was actually passed

**Fix:** Add explicit instruction:
```
TEXT GENERATION RULE (CRITICAL):
- Use ONLY the exact text provided in TEXT TO DISPLAY
- DO NOT invent, modify, or paraphrase the text
- DO NOT add extra words or change the message
- Copy the text EXACTLY as provided
```

**Test:** Check logs, compare input text vs generated text.

---

### Issue 4: Pipe "|" Showing Literally
**Symptom:** Image shows "sleep is the best skincare 😴| magnesium" with literal pipe
**Root Cause:** Gemini renders "|" as text instead of treating as separator
**Fix Location:** `gemini_service_v2.py` - text handling before generation

**Fix Options:**
A. Pre-process text: Replace "|" with actual newline before sending to Gemini
B. Clarify prompt to NEVER show "|" character in image
C. Both

**Recommended:** Option A - Pre-process:
```python
# Before passing to Gemini
if " | " in text_content:
    text_content = text_content.replace(" | ", "\n")
```

**Test:** Generate with pipe-separated text, verify line break renders correctly.

---

### Issue 5: Before/After Manual Toggle
**Symptom:** Jenny wants manual control over before/after transformation
**Root Cause:** Currently automatic detection only
**Fix Location:** Frontend + backend API

**Fix:**
1. Add checkbox in UI: "Enable Before/After Mode"
2. When enabled, first persona slide = "before" state, later slides = "after" state
3. Pass `manual_transformation=true` to backend
4. Backend applies stronger transformation instructions

**Transformation Instructions (when enabled):**
```
BEFORE STATE (first persona slide):
- Show visible skin concerns (dull, tired, problems mentioned in text)
- Less polished appearance
- Natural lighting that shows imperfections

AFTER STATE (later persona slides):
- Show dramatic improvement
- Glowing, healthy skin
- Better lighting, more radiant appearance
```

**Test:** Enable toggle, verify dramatic before/after difference.

---

### Issue 6: Real Product Not Used
**Symptom:** Avoid sugar/hydration stick slideshows not showing actual product
**Root Cause:** Product slide generates AI image instead of using product photo
**Investigation Needed:** Check if product_image_path is being passed correctly

**Fix:** Ensure product slide uses uploaded product image, not AI generation.

**Test:** Upload product image, verify it appears in product slide.

---

## Implementation Order

1. **Issue 4: Pipe "|"** - Quick fix, pre-process text (5 min)
2. **Issue 1: Nudity** - Add modesty constraint to prompts (15 min)
3. **Issue 3: Gibberish** - Add strict text copying rule (10 min)
4. **Issue 2: Body Type** - Expand TEXT-VISUAL MATCH (15 min)
5. **Issue 6: Real Product** - Investigate and fix (30 min)
6. **Issue 5: Before/After Toggle** - Frontend + backend (1+ hour)

---

## Questions Before Implementing

1. Issue 2: Should body type be detected from text automatically, or should user specify?
2. Issue 5: What UI element for before/after toggle? Checkbox? Dropdown?
3. Issue 6: Are product images being uploaded correctly? Need to check logs.

---

*Created: Feb 1, 2026*
*Methodology: Systematic Debugging - Root Cause First*
