# PRD: Cultural Context Detection & Before/After Transformation Enhancement

## Introduction/Overview

This PRD addresses two related improvements to the slideshow generation system:

1. **Cultural Context Detection**: When slideshow content explicitly discusses a specific culture's beauty/skincare practices (e.g., "Japanese skincare routine", "Korean glass skin"), the generated persona should match that cultural context while maintaining our existing persona diversity system for all other cases.

2. **Before/After Transformation Visibility**: When the storyline includes transformation slides (showing results/improvement), the "after" state should show noticeably smoother skin with visible wrinkle reduction compared to "before" slides.

**Important**: The current persona diversity system works perfectly and should NOT be changed. These enhancements only add cultural context detection as an optional layer and improve transformation slide rendering.

## Goals

1. Detect cultural context from slideshow text/storyline when content explicitly references a specific culture
2. Blend detected cultural context with existing persona demographics (not replace)
3. Identify transformation slides in the storyline (before → after progression)
4. Generate "after" slides with noticeably improved skin (50-70% wrinkle reduction) compared to "before" slides
5. Maintain current behavior for all non-cultural and non-transformation content

## User Stories

1. As a content creator, when my slideshow discusses "Japanese skincare secrets", I want the persona to be Japanese so the content feels authentic and matches the storyline.

2. As a content creator, when my slideshow has a broad audience topic (most cases), I want the current diverse persona system to work exactly as it does now.

3. As a content creator, when my slideshow shows a before/after transformation (e.g., "my skin before vs after using this product"), I want the "after" slides to show visibly smoother skin so viewers can see the improvement.

## Functional Requirements

### Cultural Context Detection

1. **FR-1**: The analysis phase MUST detect cultural context keywords from text content:
   - Asian-specific: "Japanese", "Korean", "Chinese", "K-beauty", "J-beauty", "Asian skincare"
   - African-specific: "African", "Nigerian", "shea butter tradition", "African beauty"
   - European-specific: "French", "Scandinavian", "European skincare"
   - Latin American-specific: "Brazilian", "Mexican", "Latin beauty"
   - Middle Eastern-specific: "Middle Eastern", "Arabic beauty", "Moroccan"

2. **FR-2**: Cultural context detection MUST only trigger when content EXPLICITLY mentions a culture. Ambiguous content should NOT trigger cultural matching.

3. **FR-3**: When cultural context is detected, the system MUST add a `cultural_context` field to the analysis output:
   ```json
   {
     "persona": {
       "gender": "female",
       "age_range": "20s-30s",
       "style": "casual",
       "cultural_context": "Japanese"  // NEW - only present when detected
     }
   }
   ```

4. **FR-4**: The persona generation prompt MUST blend cultural context with existing demographics when `cultural_context` is present:
   - Example: "young Japanese woman" instead of just "young woman"
   - All other persona diversity features (face shape, hair style, etc.) remain unchanged

5. **FR-5**: When NO cultural context is detected, the system MUST use the current persona generation system exactly as-is (no changes).

### Before/After Transformation Detection

6. **FR-6**: The analysis phase MUST identify transformation slides in the storyline:
   - Detect slides that show "before" state (problem/issue)
   - Detect slides that show "after" state (results/improvement)
   - Add `transformation_role` field to slides: `"before"`, `"after"`, or `null`

7. **FR-7**: Transformation detection MUST analyze:
   - Text content mentioning results, improvement, transformation
   - Storyline progression (early = problem, later = solution)
   - Keywords: "results", "after", "now", "improvement", "smooth", "clear", etc.

8. **FR-8**: Each slide MUST include transformation info in analysis output:
   ```json
   {
     "slide_index": 2,
     "slide_type": "body",
     "transformation_role": "after",  // NEW - "before", "after", or null
     "skin_improvement_level": "noticeable"  // NEW - only for "after" slides
   }
   ```

### After Slide Generation

9. **FR-9**: For slides with `transformation_role: "after"`, the generation prompt MUST include:
   - "Show noticeably smoother skin compared to earlier slides"
   - "Reduce visible wrinkles by 50-70% around forehead and eye areas"
   - "Skin should look healthier, more radiant, with visible improvement"

10. **FR-10**: For slides with `transformation_role: "before"`, the existing TEXT-VISUAL MATCH rule applies (show skin problems mentioned in text).

11. **FR-11**: The persona MUST remain consistent across before/after slides (same person, just with skin improvement).

## Non-Goals (Out of Scope)

1. Changing the existing persona diversity system for non-cultural content
2. Forcing ethnicity when content doesn't explicitly mention a culture
3. Automatic ethnicity detection from original TikTok images
4. Dramatic/unrealistic skin transformations (keep it believable)
5. Changing persona features other than ethnicity (hair style, face shape diversity remains)

## Technical Considerations

1. **Analysis Prompt Updates**: Add cultural context detection and transformation role detection to the existing analysis prompt in `gemini_service_v2.py`

2. **Persona Generation**: Modify the `generate_diverse_persona()` function to accept optional `cultural_context` parameter and blend it with existing demographics

3. **Slide Generation Prompt**: Add conditional skin improvement instructions for "after" slides in `_generate_single_image()`

4. **Backward Compatibility**: All changes must be additive - existing slideshows without cultural context or transformation should work exactly as before

## Success Metrics

1. Slideshows mentioning specific cultures generate matching personas
2. Slideshows with broad audience continue using diverse personas (no regression)
3. Before/after transformation slides show visible skin improvement difference
4. No increase in generation failures or safety blocks

## Open Questions

1. Should we log/track when cultural context is detected for analytics?
2. What confidence threshold should trigger cultural matching? (Currently: explicit keywords only)
3. Should transformation detection consider image analysis or text-only?

## Implementation Notes

### Files to Modify

1. `backend/gemini_service_v2.py`:
   - Update `ANALYSIS_PROMPT` to detect cultural context and transformation roles
   - Update `generate_diverse_persona()` to blend cultural context
   - Update `_generate_single_image()` to add skin improvement instructions for "after" slides

### Example Analysis Output

```json
{
  "persona": {
    "gender": "female",
    "age_range": "20s-30s",
    "style": "casual clean-girl",
    "cultural_context": "Korean"
  },
  "new_slides": [
    {
      "slide_index": 0,
      "slide_type": "hook",
      "transformation_role": "before",
      "text_content": "my skin was so dull and tired..."
    },
    {
      "slide_index": 1,
      "slide_type": "body",
      "transformation_role": null,
      "text_content": "korean glass skin routine changed everything"
    },
    {
      "slide_index": 2,
      "slide_type": "body",
      "transformation_role": "after",
      "skin_improvement_level": "noticeable",
      "text_content": "now my skin glows naturally"
    }
  ]
}
```
