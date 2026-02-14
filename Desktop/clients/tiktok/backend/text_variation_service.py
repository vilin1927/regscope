"""
Text Variation Service

Uses Claude API to generate hook/CTA text variations for Instagram reels.
Claude is used instead of Gemini for better creative copywriting quality.
"""
import os
import json

from logging_config import get_logger

logger = get_logger('text_variation_service')


def generate_text_variations(
    base_text: str,
    num_variations: int,
    text_type: str = 'hook'
) -> list[str]:
    """
    Generate text variations using Claude API.

    Args:
        base_text: Original text to create variations of
        num_variations: Number of variations to generate (1-10)
        text_type: 'hook' or 'cta'

    Returns:
        List of text strings (includes original as first item)
    """
    if num_variations <= 1:
        return [base_text]

    # Always include original
    variations = [base_text]
    needed = num_variations - 1

    try:
        import anthropic
    except ImportError:
        logger.warning("anthropic package not installed, returning original text only")
        return [base_text] * num_variations

    api_key = os.getenv('ANTHROPIC_API_KEY', '').strip()
    if not api_key:
        logger.warning("ANTHROPIC_API_KEY not set, returning original text only")
        return [base_text] * num_variations

    client = anthropic.Anthropic(api_key=api_key)

    if text_type == 'hook':
        prompt = f"""Rewrite this Instagram reel hook text in {needed} different ways.

Original: "{base_text}"

Rules:
- Keep the SAME meaning and tone
- Keep similar length (short, punchy)
- Use social media style (Gen Z/millennial)
- Each variation should feel natural, not forced
- No hashtags, no emojis unless the original has them
- Return ONLY a JSON array of strings, nothing else

Example output format: ["variation 1", "variation 2"]"""
    else:
        prompt = f"""Rewrite this Instagram reel CTA (call-to-action) text in {needed} different ways.

Original: "{base_text}"

Rules:
- Keep the SAME call-to-action intent
- Keep it short and direct
- Each should feel different but serve the same purpose
- Keep emojis if the original has them (like ⬇️)
- Return ONLY a JSON array of strings, nothing else

Example output format: ["variation 1", "variation 2"]"""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}]
        )

        text = response.content[0].text.strip()

        # Strip markdown code blocks if present
        if text.startswith('```'):
            text = text.split('\n', 1)[1] if '\n' in text else text[3:]
            if text.endswith('```'):
                text = text[:-3]
            text = text.strip()

        generated = json.loads(text)

        if isinstance(generated, list):
            variations.extend(generated[:needed])
            logger.info(f"Generated {len(generated)} text variations for '{base_text[:30]}...'")
        else:
            logger.warning("Claude returned non-list response")

    except json.JSONDecodeError as e:
        logger.warning(f"Failed to parse Claude response: {e}")
    except Exception as e:
        logger.error(f"Claude text variation failed: {e}")

    # Pad with original if we didn't get enough
    while len(variations) < num_variations:
        variations.append(base_text)

    return variations[:num_variations]
