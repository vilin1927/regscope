"""
Text Renderer Module

Renders text on images using PIL with various effects:
- Shadow: White text with soft drop shadow
- Outline: White text with black stroke
- Box: Black text on white pill background
"""

import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from typing import Dict, Tuple, Optional

from presets import get_preset, get_font_path, get_font_size, TextPreset


def hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
    """Convert hex color to RGB tuple."""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def load_font(font_file: str, size: int) -> ImageFont.FreeTypeFont:
    """
    Load a font with fallback.

    Args:
        font_file: Font filename
        size: Font size in pixels

    Returns:
        PIL ImageFont
    """
    font_path = get_font_path(font_file)

    if os.path.exists(font_path):
        return ImageFont.truetype(font_path, size)
    else:
        # Fallback to default font
        try:
            return ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", size)
        except:
            return ImageFont.load_default()


def get_text_bbox(
    draw: ImageDraw.ImageDraw,
    text: str,
    font: ImageFont.FreeTypeFont
) -> Tuple[int, int, int, int]:
    """
    Get text bounding box.

    Returns:
        (left, top, right, bottom) coordinates
    """
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox


def wrap_text(
    text: str,
    font: ImageFont.FreeTypeFont,
    max_width: int
) -> list:
    """
    Wrap text to fit within max_width.

    Args:
        text: Text to wrap
        font: Font to use for measurement
        max_width: Maximum width in pixels

    Returns:
        List of text lines
    """
    words = text.split()
    lines = []
    current_line = []

    # Create temporary draw for measurement
    temp_img = Image.new('RGB', (1, 1))
    draw = ImageDraw.Draw(temp_img)

    for word in words:
        current_line.append(word)
        test_line = ' '.join(current_line)
        bbox = draw.textbbox((0, 0), test_line, font=font)
        line_width = bbox[2] - bbox[0]

        if line_width > max_width and len(current_line) > 1:
            # Remove last word and add line
            current_line.pop()
            lines.append(' '.join(current_line))
            current_line = [word]

    if current_line:
        lines.append(' '.join(current_line))

    return lines


def render_shadow_text(
    image: Image.Image,
    text: str,
    position: Tuple[int, int],
    font: ImageFont.FreeTypeFont,
    text_color: str,
    shadow_color: str,
    shadow_opacity: float,
    shadow_offset: Tuple[int, int],
    shadow_blur: int
) -> Image.Image:
    """
    Render text with drop shadow effect.

    Args:
        image: Base image
        text: Text to render
        position: (x, y) position for text
        font: Font to use
        text_color: Text color (hex)
        shadow_color: Shadow color (hex)
        shadow_opacity: Shadow opacity (0-1)
        shadow_offset: Shadow offset (x, y)
        shadow_blur: Shadow blur radius

    Returns:
        Image with text rendered
    """
    # Create a copy
    result = image.copy().convert('RGBA')

    # Create shadow layer
    shadow_layer = Image.new('RGBA', result.size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow_layer)

    # Draw shadow
    shadow_pos = (position[0] + shadow_offset[0], position[1] + shadow_offset[1])
    shadow_rgb = hex_to_rgb(shadow_color)
    shadow_rgba = shadow_rgb + (int(255 * shadow_opacity),)
    shadow_draw.text(shadow_pos, text, font=font, fill=shadow_rgba)

    # Blur shadow
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(shadow_blur))

    # Composite shadow
    result = Image.alpha_composite(result, shadow_layer)

    # Draw text
    text_layer = Image.new('RGBA', result.size, (0, 0, 0, 0))
    text_draw = ImageDraw.Draw(text_layer)
    text_rgb = hex_to_rgb(text_color)
    text_draw.text(position, text, font=font, fill=text_rgb + (255,))

    # Composite text
    result = Image.alpha_composite(result, text_layer)

    return result.convert('RGB')


def render_outline_text(
    image: Image.Image,
    text: str,
    position: Tuple[int, int],
    font: ImageFont.FreeTypeFont,
    text_color: str,
    outline_color: str,
    outline_width: int
) -> Image.Image:
    """
    Render text with outline/stroke effect.

    Args:
        image: Base image
        text: Text to render
        position: (x, y) position for text
        font: Font to use
        text_color: Text color (hex)
        outline_color: Outline color (hex)
        outline_width: Outline width in pixels

    Returns:
        Image with text rendered
    """
    result = image.copy().convert('RGBA')
    draw = ImageDraw.Draw(result)

    text_rgb = hex_to_rgb(text_color)
    outline_rgb = hex_to_rgb(outline_color)

    x, y = position

    # Draw outline by drawing text multiple times offset
    for dx in range(-outline_width, outline_width + 1):
        for dy in range(-outline_width, outline_width + 1):
            if dx != 0 or dy != 0:
                draw.text((x + dx, y + dy), text, font=font, fill=outline_rgb + (255,))

    # Draw main text
    draw.text(position, text, font=font, fill=text_rgb + (255,))

    return result.convert('RGB')


def render_box_text(
    image: Image.Image,
    text: str,
    position: Tuple[int, int],
    font: ImageFont.FreeTypeFont,
    text_color: str,
    box_color: str,
    box_padding: int,
    box_radius: int
) -> Image.Image:
    """
    Render text with pill/box background.

    Args:
        image: Base image
        text: Text to render
        position: (x, y) position for text (box will be centered here)
        font: Font to use
        text_color: Text color (hex)
        box_color: Box background color (hex)
        box_padding: Padding inside box
        box_radius: Corner radius for rounded box

    Returns:
        Image with text rendered
    """
    result = image.copy().convert('RGBA')
    draw = ImageDraw.Draw(result)

    # Get text size
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    # Calculate box dimensions
    box_width = text_width + 2 * box_padding
    box_height = text_height + 2 * box_padding

    # Center box at position
    box_x = position[0] - box_padding
    box_y = position[1] - box_padding

    # Draw rounded rectangle
    box_rgb = hex_to_rgb(box_color)
    draw.rounded_rectangle(
        [box_x, box_y, box_x + box_width, box_y + box_height],
        radius=box_radius,
        fill=box_rgb + (255,)
    )

    # Draw text
    text_rgb = hex_to_rgb(text_color)
    draw.text(position, text, font=font, fill=text_rgb + (255,))

    return result.convert('RGB')


def render_text(
    image_path: str,
    text: str,
    zone: Dict,
    preset_id: str,
    output_path: Optional[str] = None
) -> Image.Image:
    """
    Render text on image using specified preset.

    Main entry point for text rendering.

    Args:
        image_path: Path to base image
        text: Text to render
        zone: Safe zone dict with bounds {x, y, w, h} and text_color_suggestion
        preset_id: Preset ID (e.g., 'classic_shadow')
        output_path: Optional path to save result

    Returns:
        PIL Image with text rendered
    """
    # Load image
    image = Image.open(image_path)
    img_width, img_height = image.size

    # Get preset
    preset = get_preset(preset_id)
    if preset is None:
        raise ValueError(f"Unknown preset: {preset_id}")

    # Calculate font size
    font_size = get_font_size(len(text), img_height)
    font = load_font(preset.font.file, font_size)

    # Get zone bounds
    bounds = zone['bounds']
    zone_x = bounds['x']
    zone_y = bounds['y']
    zone_w = bounds['w']
    zone_h = bounds['h']

    # Wrap text to fit zone
    max_text_width = zone_w - 40  # Padding
    lines = wrap_text(text, font, max_text_width)

    # Calculate total text height
    temp_img = Image.new('RGB', (1, 1))
    temp_draw = ImageDraw.Draw(temp_img)
    line_height = font_size * 1.3  # 1.3x line spacing
    total_height = len(lines) * line_height

    # Calculate starting position (center in zone)
    start_x = zone_x + (zone_w - max_text_width) // 2
    start_y = zone_y + (zone_h - total_height) // 2

    # Get effect config
    effect = preset.effect

    # Render each line
    result = image
    for i, line in enumerate(lines):
        y = int(start_y + i * line_height)

        # Center line horizontally
        bbox = temp_draw.textbbox((0, 0), line, font=font)
        line_width = bbox[2] - bbox[0]
        x = int(zone_x + (zone_w - line_width) // 2)

        if effect.type == 'shadow':
            result = render_shadow_text(
                result, line, (x, y), font,
                effect.text_color,
                effect.shadow_color,
                effect.shadow_opacity,
                effect.shadow_offset,
                effect.shadow_blur
            )
        elif effect.type == 'outline':
            result = render_outline_text(
                result, line, (x, y), font,
                effect.text_color,
                effect.outline_color,
                effect.outline_width
            )
        elif effect.type == 'box':
            result = render_box_text(
                result, line, (x, y), font,
                effect.text_color,
                effect.box_color,
                effect.box_padding,
                effect.box_radius
            )

    # Save if output path provided
    if output_path:
        result.save(output_path, quality=95)

    return result
