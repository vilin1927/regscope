"""
TikTok Copy Service
Converts TikTok slideshows into MP4 videos with optional slide replacement.
"""
import os
import shutil
import subprocess
import tempfile
import uuid
from typing import Optional
from dotenv import load_dotenv

from image_transforms import transform_single_image_file

load_dotenv()

from logging_config import get_logger, get_request_logger

logger = get_logger('tiktok_copy')

# Video settings (from PRD)
VIDEO_WIDTH = 1080
VIDEO_HEIGHT = 1920
PHOTO_DURATION = 3  # seconds per photo
VIDEO_CODEC = 'libx264'
AUDIO_CODEC = 'aac'
VIDEO_FPS = 30


class TikTokCopyError(Exception):
    """Custom exception for TikTok copy errors"""
    pass


def replace_slide(images: list[str], slide_number: int, replacement_path: str) -> list[str]:
    """
    Replace a specific slide in the images list.

    Args:
        images: List of image paths
        slide_number: Which slide to replace (1-indexed, e.g., 2 = second slide)
        replacement_path: Path to the replacement image

    Returns:
        Modified list of image paths
    """
    if not replacement_path or not os.path.exists(replacement_path):
        logger.warning(f"Replacement image not found: {replacement_path}")
        return images

    # Convert to 0-indexed
    index = slide_number - 1

    # Create a copy of the list
    result = images.copy()

    if index < 0:
        logger.warning(f"Invalid slide number {slide_number}, must be positive")
        return result

    if index < len(result):
        # Replace existing slide
        result[index] = replacement_path
        logger.info(f"Replaced slide {slide_number} with {replacement_path}")
    else:
        # Append to end if slide number exceeds total
        result.append(replacement_path)
        logger.info(f"Slide {slide_number} exceeds total ({len(images)}), appended to end")

    return result


def assemble_video(
    images: list[str],
    audio_path: Optional[str],
    output_path: str,
    request_id: str = None
) -> str:
    """
    Assemble images and audio into an MP4 video using FFmpeg.

    Args:
        images: List of image paths in order
        audio_path: Path to audio file (optional)
        output_path: Where to save the output video
        request_id: Optional request ID for logging

    Returns:
        Path to the created video file

    Raises:
        TikTokCopyError: If video assembly fails
    """
    log = get_request_logger('tiktok_copy', request_id) if request_id else logger

    if not images:
        raise TikTokCopyError("No images provided for video assembly")

    # Validate all images exist
    for img in images:
        if not os.path.exists(img):
            raise TikTokCopyError(f"Image not found: {img}")

    # Create temp directory for renamed sequential images
    temp_dir = tempfile.mkdtemp(prefix='tiktok_copy_')

    try:
        # Copy images with sequential names (ffmpeg concat demuxer needs this)
        # We'll use the concat demuxer with a file list for more control
        file_list_path = os.path.join(temp_dir, 'files.txt')

        # Variation key for transforms: use request_id or generate unique one
        var_key = request_id or str(uuid.uuid4())[:8]

        with open(file_list_path, 'w') as f:
            for i, img in enumerate(images):
                # Normalize all images to JPEG for concat demuxer compatibility
                # (mixing RGBA PNG with JPEG causes silent frame drops)
                temp_img = os.path.join(temp_dir, f'img_{i:04d}.jpg')
                ext = os.path.splitext(img)[1].lower()
                if ext in ('.png', '.webp', '.bmp', '.tiff'):
                    subprocess.run(
                        ['ffmpeg', '-y', '-i', img, '-q:v', '2', temp_img],
                        capture_output=True, timeout=30
                    )
                else:
                    shutil.copy2(img, temp_img)

                # Apply uniqueness transforms to defeat TikTok fingerprinting
                transform_single_image_file(temp_img, variation_key=var_key, image_index=i)

                # Write to concat file list (duration in seconds)
                f.write(f"file '{temp_img}'\n")
                f.write(f"duration {PHOTO_DURATION}\n")

            # Add last image again (needed for concat demuxer to show final frame)
            f.write(f"file '{temp_img}'\n")

        log.info(f"Prepared {len(images)} images for video assembly")

        # Ensure output directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        # Build FFmpeg command
        # Scale images to 1080x1920, center with black padding if needed
        vf_filter = (
            f"scale={VIDEO_WIDTH}:{VIDEO_HEIGHT}:"
            "force_original_aspect_ratio=decrease,"
            f"pad={VIDEO_WIDTH}:{VIDEO_HEIGHT}:(ow-iw)/2:(oh-ih)/2:black,"
            "format=yuv420p"
        )

        # Calculate exact video duration
        video_duration = len(images) * PHOTO_DURATION

        if audio_path and os.path.exists(audio_path):
            # With audio - loop audio to match video duration
            # Use -stream_loop to loop audio if shorter than video
            # Use -t to set exact output duration
            cmd = [
                'ffmpeg', '-y',
                '-f', 'concat',
                '-safe', '0',
                '-i', file_list_path,
                '-stream_loop', '-1',  # Loop audio indefinitely
                '-i', audio_path,
                '-vf', vf_filter,
                '-c:v', VIDEO_CODEC,
                '-r', str(VIDEO_FPS),
                '-c:a', AUDIO_CODEC,
                '-t', str(video_duration),  # Set exact output duration
                '-movflags', '+faststart',  # Optimize for streaming
                output_path
            ]
            log.info(f"Assembling video with audio (duration: {video_duration}s)")
        else:
            # Without audio
            cmd = [
                'ffmpeg', '-y',
                '-f', 'concat',
                '-safe', '0',
                '-i', file_list_path,
                '-vf', vf_filter,
                '-c:v', VIDEO_CODEC,
                '-r', str(VIDEO_FPS),
                '-an',  # No audio
                '-movflags', '+faststart',
                output_path
            ]
            log.info("Assembling video without audio")

        # Run FFmpeg
        log.debug(f"Running FFmpeg: {' '.join(cmd)}")
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )

        if result.returncode != 0:
            log.error(f"FFmpeg failed: {result.stderr}")
            raise TikTokCopyError(f"FFmpeg failed: {result.stderr[:500]}")

        if not os.path.exists(output_path):
            raise TikTokCopyError("FFmpeg completed but output file not found")

        file_size = os.path.getsize(output_path) / (1024 * 1024)
        log.info(f"Video created: {output_path} ({file_size:.1f}MB)")

        return output_path

    finally:
        # Clean up temp directory
        try:
            shutil.rmtree(temp_dir)
        except Exception as e:
            log.warning(f"Failed to clean up temp dir: {e}")


def process_tiktok_copy(
    scraped_data: dict,
    output_dir: str,
    video_filename: str = "video.mp4",
    replace_slide_number: Optional[int] = None,
    product_photo_path: Optional[str] = None,
    request_id: str = None
) -> str:
    """
    Full pipeline: process scraped TikTok data into video.

    Args:
        scraped_data: Output from tiktok_scraper.scrape_tiktok_slideshow()
        output_dir: Directory for output
        video_filename: Name for the output video file
        replace_slide_number: Optional slide number to replace (1-indexed)
        product_photo_path: Optional path to replacement image
        request_id: Optional request ID for logging

    Returns:
        Path to the created video file
    """
    log = get_request_logger('tiktok_copy', request_id) if request_id else logger

    images = scraped_data.get('images', [])
    audio_path = scraped_data.get('audio')

    if not images:
        raise TikTokCopyError("No images in scraped data")

    log.info(f"Processing TikTok copy: {len(images)} images, audio={bool(audio_path)}")

    # Apply slide replacement if requested
    if replace_slide_number and product_photo_path:
        log.info(f"Replacing slide {replace_slide_number} with product photo")
        images = replace_slide(images, replace_slide_number, product_photo_path)

    # Create output path
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, video_filename)

    # Assemble video
    return assemble_video(
        images=images,
        audio_path=audio_path,
        output_path=output_path,
        request_id=request_id
    )


# For testing
if __name__ == '__main__':
    import sys

    print("TikTok Copy Service")
    print(f"Video settings: {VIDEO_WIDTH}x{VIDEO_HEIGHT}, {PHOTO_DURATION}s per photo")

    # Check FFmpeg availability
    try:
        result = subprocess.run(['ffmpeg', '-version'], capture_output=True, text=True)
        if result.returncode == 0:
            version_line = result.stdout.split('\n')[0]
            print(f"FFmpeg: {version_line}")
        else:
            print("FFmpeg: NOT FOUND")
    except FileNotFoundError:
        print("FFmpeg: NOT FOUND - Please install FFmpeg")
