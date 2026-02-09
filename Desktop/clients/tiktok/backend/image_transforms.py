"""
Image Uniqueness Transforms

Applies pixel-level transforms to images before video creation, making each
output unique to TikTok's content fingerprinting (perceptual hashing + deep learning).

Used by both:
- TikTok Copy pipeline (scraped images already in TikTok's fingerprint DB)
- Main Slideshow pipeline (AI-generated variations that look too similar)

Transforms are deterministic per (variation_key, image_index) pair so results
are reproducible but different across variations.
"""
import hashlib
import os
import random
import shutil
import tempfile

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

from logging_config import get_logger

logger = get_logger('image_transforms')


def _make_seed(variation_key: str, image_index: int) -> int:
    """
    Create a deterministic seed from variation key and image index.
    Same inputs always produce the same transforms.
    """
    raw = f"{variation_key}_{image_index}"
    return int(hashlib.md5(raw.encode()).hexdigest()[:8], 16)


def _apply_rotation(img: Image.Image, rng: random.Random) -> Image.Image:
    """Rotate 0.5-1.5 degrees (random direction). Changes pixel grid structure."""
    angle = rng.uniform(0.5, 1.5) * rng.choice([-1, 1])
    return img.rotate(angle, resample=Image.BICUBIC, expand=False, fillcolor=(0, 0, 0))


def _apply_zoom(img: Image.Image, rng: random.Random) -> Image.Image:
    """Zoom 2-5% center crop. Changes framing, breaks structural hash."""
    w, h = img.size
    zoom_pct = rng.uniform(0.02, 0.05)
    crop_x = int(w * zoom_pct / 2)
    crop_y = int(h * zoom_pct / 2)
    cropped = img.crop((crop_x, crop_y, w - crop_x, h - crop_y))
    return cropped.resize((w, h), Image.LANCZOS)


def _apply_edge_crop(img: Image.Image, rng: random.Random) -> Image.Image:
    """Asymmetric 1-5px crop per side. Shifts pixel grid unpredictably."""
    w, h = img.size
    left = rng.randint(1, 5)
    top = rng.randint(1, 5)
    right = rng.randint(1, 5)
    bottom = rng.randint(1, 5)
    cropped = img.crop((left, top, w - right, h - bottom))
    return cropped.resize((w, h), Image.LANCZOS)


def _apply_brightness(img: Image.Image, rng: random.Random) -> Image.Image:
    """Adjust brightness +/- 5-10%. Alters luminance fingerprint."""
    factor = 1.0 + rng.uniform(0.05, 0.10) * rng.choice([-1, 1])
    return ImageEnhance.Brightness(img).enhance(factor)


def _apply_color_temperature(img: Image.Image, rng: random.Random) -> Image.Image:
    """Warm/cool color shift. Alters color fingerprint."""
    arr = np.array(img, dtype=np.float32)
    shift = rng.uniform(3, 8)
    if rng.random() < 0.5:
        # Warm: boost red, reduce blue
        arr[:, :, 0] = np.clip(arr[:, :, 0] + shift, 0, 255)
        arr[:, :, 2] = np.clip(arr[:, :, 2] - shift, 0, 255)
    else:
        # Cool: boost blue, reduce red
        arr[:, :, 2] = np.clip(arr[:, :, 2] + shift, 0, 255)
        arr[:, :, 0] = np.clip(arr[:, :, 0] - shift, 0, 255)
    return Image.fromarray(arr.astype(np.uint8))


def _apply_noise(img: Image.Image, rng: random.Random) -> Image.Image:
    """Add 1-2% gaussian noise. Breaks exact pixel matching."""
    arr = np.array(img, dtype=np.float32)
    intensity = rng.uniform(1, 2) / 100 * 255  # 1-2% of full range
    noise = np.random.RandomState(rng.randint(0, 2**31)).normal(0, intensity, arr.shape)
    arr = np.clip(arr + noise, 0, 255)
    return Image.fromarray(arr.astype(np.uint8))


def _strip_exif(img: Image.Image) -> Image.Image:
    """Remove all EXIF metadata. Removes origin tracking."""
    data = list(img.getdata())
    clean = Image.new(img.mode, img.size)
    clean.putdata(data)
    return clean


def transform_single_image(img: Image.Image, variation_key: str, image_index: int) -> Image.Image:
    """
    Apply the full transform pipeline to a single PIL Image.

    Args:
        img: PIL Image to transform
        variation_key: Unique key for this variation (e.g. "p1_t1", request_id)
        image_index: Index of this image in the sequence

    Returns:
        Transformed PIL Image (same dimensions as input)
    """
    seed = _make_seed(variation_key, image_index)
    rng = random.Random(seed)

    original_size = img.size

    # Ensure RGB mode
    if img.mode != 'RGB':
        img = img.convert('RGB')

    img = _apply_rotation(img, rng)
    img = _apply_zoom(img, rng)
    img = _apply_edge_crop(img, rng)
    img = _apply_brightness(img, rng)
    img = _apply_color_temperature(img, rng)
    img = _apply_noise(img, rng)
    img = _strip_exif(img)

    # Ensure output matches original dimensions
    if img.size != original_size:
        img = img.resize(original_size, Image.LANCZOS)

    return img


def transform_single_image_file(file_path: str, variation_key: str, image_index: int) -> bool:
    """
    Transform an image file in-place.

    Args:
        file_path: Path to the image file (will be overwritten)
        variation_key: Unique key for this variation
        image_index: Index of this image in the sequence

    Returns:
        True if transform succeeded, False on failure (original preserved)
    """
    try:
        img = Image.open(file_path)
        transformed = transform_single_image(img, variation_key, image_index)
        transformed.save(file_path, quality=95)
        return True
    except Exception as e:
        logger.warning(f"Transform failed for {file_path}, keeping original: {e}")
        return False


def transform_images_for_variation(
    image_paths: list[str],
    variation_key: str,
    output_dir: str
) -> list[str]:
    """
    Transform a batch of images for a single variation, writing to output_dir.

    Original files are never modified. On failure for any single image,
    the original is copied as-is (graceful fallback).

    Args:
        image_paths: List of source image paths
        variation_key: Unique key for this variation
        output_dir: Directory to write transformed images

    Returns:
        List of transformed image paths in output_dir
    """
    os.makedirs(output_dir, exist_ok=True)
    result_paths = []

    for i, src_path in enumerate(image_paths):
        filename = os.path.basename(src_path)
        dst_path = os.path.join(output_dir, filename)

        try:
            img = Image.open(src_path)
            transformed = transform_single_image(img, variation_key, i)
            transformed.save(dst_path, quality=95)
            result_paths.append(dst_path)
        except Exception as e:
            logger.warning(f"Transform failed for {src_path}, copying original: {e}")
            shutil.copy2(src_path, dst_path)
            result_paths.append(dst_path)

    logger.info(f"Transformed {len(result_paths)} images for variation '{variation_key}'")
    return result_paths
