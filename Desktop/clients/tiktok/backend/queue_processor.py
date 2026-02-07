"""
Queue Processor - Batch Image Generation Worker
Processes up to 18 images every 60 seconds from the global queue.
"""
import os
import sys
import time
import signal
import threading
import re
import json
import gc
from concurrent.futures import ThreadPoolExecutor, as_completed, TimeoutError
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()


def get_memory_usage_mb() -> float:
    """Get current process memory usage in MB (RSS - Resident Set Size)."""
    try:
        # Read from /proc/self/status (Linux)
        with open('/proc/self/status', 'r') as f:
            for line in f:
                if line.startswith('VmRSS:'):
                    # Format: "VmRSS:    123456 kB"
                    parts = line.split()
                    return int(parts[1]) / 1024  # Convert kB to MB
    except:
        pass

    # Fallback: use resource module
    try:
        import resource
        # Returns bytes on Linux, need to convert
        usage = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
        # On Linux ru_maxrss is in KB, on macOS it's in bytes
        if sys.platform == 'darwin':
            return usage / (1024 * 1024)
        return usage / 1024
    except:
        return 0.0

from logging_config import setup_logging, get_logger

# Initialize logging (must be done before get_logger)
setup_logging()
logger = get_logger('queue_processor')

from image_queue import (
    GlobalImageQueue, ImageTask, get_global_queue,
    BATCH_SIZE, BATCH_INTERVAL, MAX_RETRIES
)

from google import genai
from google.genai import types

# Import image generation function from gemini_service_v2
# We'll call the low-level generation function directly
from gemini_service_v2 import (
    _generate_single_image, _get_client, _record_api_usage, _validate_image_structure,
    IMAGE_MODEL, REQUEST_TIMEOUT
)

# Configuration
BATCH_TIMEOUT = 120  # Max seconds to wait for individual image generation
PAUSE_ON_RATE_LIMIT = True  # Pause queue on 429 errors
RATE_LIMIT_PAUSE_DEFAULT = 65  # Default pause duration for rate limits
CLEANUP_INTERVAL = 10  # Run cleanup every N batches
STALE_TASK_TIMEOUT = 1800  # Tasks stuck in processing for 30 min are stale


class BatchProcessor:
    """
    Processes image generation tasks in batches.

    Every 60 seconds:
    1. Pull up to 18 tasks from queue (FIFO, respecting dependencies)
    2. Submit all to Gemini API in parallel
    3. Handle results as they complete
    4. Start next batch at exactly t+60s (strict timer)
    """

    def __init__(self, queue: Optional[GlobalImageQueue] = None):
        self.queue = queue or get_global_queue()
        # Note: We no longer store a single client - each image generation
        # gets a fresh client with key rotation from ApiKeyManager
        self.running = False
        self._stop_event = threading.Event()
        self._paused = False
        self._pause_until = 0

        # Stats
        self.batches_processed = 0
        self.images_generated = 0
        self.images_failed = 0
        self._last_cleanup = 0  # Batch count at last cleanup

        logger.info(f"BatchProcessor initialized: batch_size={BATCH_SIZE}, interval={BATCH_INTERVAL}s")

    def start(self):
        """Start the processor in the current thread."""
        logger.info("BatchProcessor starting...")
        self.running = True
        self._stop_event.clear()

        # Set up signal handlers for graceful shutdown
        signal.signal(signal.SIGTERM, self._handle_shutdown)
        signal.signal(signal.SIGINT, self._handle_shutdown)

        try:
            self._run_loop()
        except Exception as e:
            logger.error(f"BatchProcessor crashed: {e}", exc_info=True)
            raise
        finally:
            self.running = False
            logger.info("BatchProcessor stopped")

    def stop(self):
        """Signal the processor to stop."""
        logger.info("BatchProcessor stopping...")
        self._stop_event.set()

    def _handle_shutdown(self, signum, frame):
        """Handle shutdown signals gracefully."""
        logger.info(f"Received signal {signum}, initiating shutdown...")
        self.stop()

    def _run_loop(self):
        """Main processing loop - strict 60-second batches."""
        while not self._stop_event.is_set():
            batch_start = time.time()

            # Check if paused (rate limit recovery)
            if self._paused and time.time() < self._pause_until:
                wait_time = self._pause_until - time.time()
                logger.info(f"Queue paused for rate limit recovery, waiting {wait_time:.1f}s...")
                self._stop_event.wait(min(wait_time, BATCH_INTERVAL))
                continue
            self._paused = False

            # Get batch of tasks
            tasks = self.queue.get_batch(BATCH_SIZE)

            if tasks:
                # Log memory before processing
                mem_before = get_memory_usage_mb()
                queue_stats = self.queue.get_queue_stats()
                logger.info(f"Processing batch #{self.batches_processed + 1}: {len(tasks)} tasks | "
                           f"Memory: {mem_before:.0f}MB | "
                           f"Queue: {queue_stats['pending']} pending, {queue_stats['processing']} processing")

                self._process_batch(tasks)
                self.batches_processed += 1

                # Log memory after processing
                mem_after = get_memory_usage_mb()
                mem_delta = mem_after - mem_before
                logger.info(f"Batch #{self.batches_processed} complete | "
                           f"Memory: {mem_after:.0f}MB ({mem_delta:+.0f}MB) | "
                           f"Generated: {self.images_generated}, Failed: {self.images_failed}")

                # Force garbage collection if memory grew significantly
                if mem_delta > 100:  # More than 100MB growth
                    gc.collect()
                    mem_after_gc = get_memory_usage_mb()
                    logger.info(f"GC triggered: {mem_after:.0f}MB -> {mem_after_gc:.0f}MB")

                # Run periodic cleanup
                self._run_periodic_cleanup()
            else:
                # Log memory stats even when idle (every 5 minutes worth of batches)
                if self.batches_processed % 5 == 0:
                    mem = get_memory_usage_mb()
                    queue_stats = self.queue.get_queue_stats()
                    logger.debug(f"Idle | Memory: {mem:.0f}MB | Queue: {queue_stats['pending']} pending")

            # Calculate time to wait until next batch
            elapsed = time.time() - batch_start
            wait_time = max(0, BATCH_INTERVAL - elapsed)

            if wait_time > 0:
                logger.debug(f"Batch completed in {elapsed:.1f}s, waiting {wait_time:.1f}s for next batch")
                # Use event wait so we can be interrupted for shutdown
                self._stop_event.wait(wait_time)

    def _process_batch(self, tasks: List[ImageTask]):
        """
        Process all tasks in parallel.

        Args:
            tasks: List of ImageTask objects to process
        """
        # Track results
        succeeded = 0
        failed = 0

        # Submit all tasks to thread pool
        with ThreadPoolExecutor(max_workers=BATCH_SIZE) as executor:
            # Submit all tasks
            futures = {
                executor.submit(self._generate_image, task): task
                for task in tasks
            }

            # Process results as they complete (no timeout - strict 60s timer handles pacing)
            for future in as_completed(futures):
                task = futures[future]
                try:
                    result_path = future.result(timeout=BATCH_TIMEOUT)
                    self.queue.mark_complete(task.task_id, result_path)
                    succeeded += 1
                    self.images_generated += 1
                    logger.info(f"Task {task.task_id} completed: {os.path.basename(result_path)}")

                except TimeoutError:
                    self.queue.mark_failed(task.task_id, "Generation timeout")
                    failed += 1
                    self.images_failed += 1
                    logger.warning(f"Task {task.task_id} timed out")

                except RateLimitError as e:
                    # Rate limit - pause queue and don't count against retries
                    self.queue.mark_failed(task.task_id, str(e), is_rate_limit=True)
                    failed += 1
                    self._handle_rate_limit(e)

                except FileNotFoundError as e:
                    # Missing files - permanent failure, no retries
                    self.queue.mark_failed(task.task_id, str(e), permanent=True)
                    failed += 1
                    self.images_failed += 1
                    logger.error(f"Task {task.task_id} permanently failed (missing file): {e}")

                except Exception as e:
                    self.queue.mark_failed(task.task_id, str(e))
                    failed += 1
                    self.images_failed += 1
                    logger.error(f"Task {task.task_id} failed: {e}")

        logger.info(f"Batch complete: {succeeded} succeeded, {failed} failed")

    def _generate_image(self, task: ImageTask) -> str:
        """
        Generate a single image using Gemini API.

        Args:
            task: ImageTask with all generation parameters

        Returns:
            Path to generated image

        Raises:
            RateLimitError: If API returns 429
            FileNotFoundError: If reference files are missing
            Exception: For other errors
        """
        # Validate reference files exist before attempting generation
        if task.reference_image_path and not os.path.exists(task.reference_image_path):
            raise FileNotFoundError(f"Reference image missing: {task.reference_image_path}")
        if task.product_image_path and not os.path.exists(task.product_image_path):
            raise FileNotFoundError(f"Product image missing: {task.product_image_path}")
        if task.persona_reference_path and not os.path.exists(task.persona_reference_path):
            raise FileNotFoundError(f"Persona reference missing: {task.persona_reference_path}")

        # Get a fresh client with key rotation
        client, api_key = _get_client()

        try:
            # Call the low-level generation function
            result_path = _generate_single_image(
                client=client,
                slide_type=task.slide_type,
                scene_description=task.scene_description,
                text_content=task.text_content,
                text_position_hint=task.text_position_hint,
                output_path=task.output_path,
                reference_image_path=task.reference_image_path,
                product_image_path=task.product_image_path,
                persona_reference_path=task.persona_reference_path,
                has_persona=task.has_persona,
                text_style=task.text_style,
                visual_style=task.visual_style,
                persona_info=task.persona_info,  # Demographics for new persona creation
                version=task.version,
                clean_image_mode=task.clean_image_mode,
                product_description=task.product_description,
                shows_product_on_face=task.shows_product_on_face,  # Per-slide face tape flag
                transformation_role=task.transformation_role or None,  # "before", "after", or None
                transformation_problem=task.transformation_problem or None,  # "under_eye", "forehead_lines", etc.
                layout_type=task.layout_type or "single",  # "single" or "split_screen"
                split_config=task.split_config or None  # Split-screen configuration
            )

            # Record successful API usage
            _record_api_usage(api_key, success=True)
            return result_path

        except Exception as e:
            error_str = str(e).lower()

            # Check for rate limit
            if '429' in error_str or 'resource_exhausted' in error_str or 'rate' in error_str:
                # Record rate limit failure - marks this key as exhausted
                _record_api_usage(api_key, success=False, is_rate_limit=True)
                # Extract retry delay if present
                match = re.search(r'retry.*?(\d+)', error_str)
                retry_after = int(match.group(1)) if match else RATE_LIMIT_PAUSE_DEFAULT
                raise RateLimitError(f"Rate limit exceeded, retry after {retry_after}s", retry_after)

            # Record other failures
            _record_api_usage(api_key, success=False)
            raise

    def _handle_rate_limit(self, error: 'RateLimitError'):
        """
        Handle rate limit error by pausing the queue.

        Args:
            error: RateLimitError with retry_after duration
        """
        if PAUSE_ON_RATE_LIMIT:
            pause_duration = error.retry_after + 5  # Add buffer
            self._paused = True
            self._pause_until = time.time() + pause_duration
            logger.warning(f"Rate limit hit! Pausing queue for {pause_duration}s")

    def _run_periodic_cleanup(self):
        """
        Run periodic cleanup of stale tasks.
        Called every CLEANUP_INTERVAL batches.
        """
        if self.batches_processed - self._last_cleanup < CLEANUP_INTERVAL:
            return

        self._last_cleanup = self.batches_processed
        logger.info("Running periodic queue cleanup...")

        try:
            cleaned = self._cleanup_stale_tasks()
            if cleaned > 0:
                logger.info(f"Cleanup complete: removed {cleaned} stale tasks")
        except Exception as e:
            logger.error(f"Cleanup failed: {e}")

    def _cleanup_stale_tasks(self) -> int:
        """
        Remove stale tasks from the queue:
        1. Tasks with missing reference files
        2. Tasks stuck in processing for too long

        Returns count of removed tasks.
        """
        cleaned = 0

        # Get all tasks in processing queue
        processing_tasks = self.queue.redis.zrange(self.queue.PROCESSING_KEY, 0, -1)

        for task_id in processing_tasks:
            task_data_key = f"{self.queue.TASK_DATA_PREFIX}{task_id}"
            task_json = self.queue.redis.get(task_data_key)

            if not task_json:
                # Task data missing - remove from processing
                self.queue.redis.zrem(self.queue.PROCESSING_KEY, task_id)
                cleaned += 1
                logger.warning(f"Removed orphaned task (no data): {task_id}")
                continue

            try:
                task_data = json.loads(task_json)
            except:
                self.queue.redis.zrem(self.queue.PROCESSING_KEY, task_id)
                self.queue.redis.delete(task_data_key)
                cleaned += 1
                logger.warning(f"Removed corrupted task: {task_id}")
                continue

            # Check if reference files exist
            ref_path = task_data.get('reference_image_path', '')
            if ref_path and not os.path.exists(ref_path):
                self.queue.redis.zrem(self.queue.PROCESSING_KEY, task_id)
                self.queue.redis.delete(task_data_key)
                self.queue.redis.sadd(self.queue.FAILED_KEY, task_id)
                cleaned += 1
                logger.warning(f"Removed task with missing file: {task_id} ({ref_path})")
                continue

            # Check if task is stuck (in processing too long)
            started_at = task_data.get('started_at', '')
            if started_at:
                try:
                    from datetime import datetime
                    start_time = datetime.fromisoformat(started_at)
                    elapsed = (datetime.now() - start_time).total_seconds()
                    if elapsed > STALE_TASK_TIMEOUT:
                        self.queue.redis.zrem(self.queue.PROCESSING_KEY, task_id)
                        self.queue.redis.delete(task_data_key)
                        self.queue.redis.sadd(self.queue.FAILED_KEY, task_id)
                        cleaned += 1
                        logger.warning(f"Removed stale task (stuck {elapsed:.0f}s): {task_id}")
                except:
                    pass

        # Also clean retry queue for tasks with missing files
        retry_tasks = self.queue.redis.zrange(self.queue.RETRY_KEY, 0, -1)
        for task_id in retry_tasks:
            task_data_key = f"{self.queue.TASK_DATA_PREFIX}{task_id}"
            task_json = self.queue.redis.get(task_data_key)

            if not task_json:
                self.queue.redis.zrem(self.queue.RETRY_KEY, task_id)
                cleaned += 1
                continue

            try:
                task_data = json.loads(task_json)
                ref_path = task_data.get('reference_image_path', '')
                if ref_path and not os.path.exists(ref_path):
                    self.queue.redis.zrem(self.queue.RETRY_KEY, task_id)
                    self.queue.redis.delete(task_data_key)
                    self.queue.redis.sadd(self.queue.FAILED_KEY, task_id)
                    cleaned += 1
                    logger.warning(f"Removed retry task with missing file: {task_id}")
            except:
                pass

        # CRITICAL: Clean pending queue for tasks with missing files or too old
        # This prevents deadlocks where tasks wait forever for deleted temp files
        from datetime import datetime
        pending_tasks = self.queue.redis.zrange(self.queue.PENDING_KEY, 0, -1)
        for task_id in pending_tasks:
            task_data_key = f"{self.queue.TASK_DATA_PREFIX}{task_id}"
            task_data = self.queue.redis.hgetall(task_data_key)

            if not task_data:
                self.queue.redis.zrem(self.queue.PENDING_KEY, task_id)
                cleaned += 1
                logger.warning(f"Removed orphaned pending task (no data): {task_id}")
                continue

            # Check if reference files exist
            ref_path = task_data.get('reference_image_path', '')
            if ref_path and not os.path.exists(ref_path):
                self.queue.redis.zrem(self.queue.PENDING_KEY, task_id)
                self.queue.redis.delete(task_data_key)
                self.queue.redis.sadd(self.queue.FAILED_KEY, task_id)
                cleaned += 1
                logger.warning(f"Removed pending task with missing file: {task_id}")
                continue

            # Check if task is too old (older than 2 hours = likely orphaned)
            created_at = task_data.get('created_at', '')
            if created_at:
                try:
                    create_time = datetime.fromisoformat(created_at)
                    age_seconds = (datetime.utcnow() - create_time).total_seconds()
                    if age_seconds > 7200:  # 2 hours
                        self.queue.redis.zrem(self.queue.PENDING_KEY, task_id)
                        self.queue.redis.delete(task_data_key)
                        self.queue.redis.sadd(self.queue.FAILED_KEY, task_id)
                        cleaned += 1
                        logger.warning(f"Removed stale pending task (age {age_seconds/3600:.1f}h): {task_id}")
                except:
                    pass

        return cleaned

    def get_stats(self) -> dict:
        """Get processor statistics."""
        return {
            'running': self.running,
            'paused': self._paused,
            'batches_processed': self.batches_processed,
            'images_generated': self.images_generated,
            'images_failed': self.images_failed,
            'queue_stats': self.queue.get_queue_stats()
        }


class RateLimitError(Exception):
    """Exception for rate limit errors with retry information."""
    def __init__(self, message: str, retry_after: int = RATE_LIMIT_PAUSE_DEFAULT):
        super().__init__(message)
        self.retry_after = retry_after


def main():
    """Main entry point for queue processor."""
    logger.info("=" * 60)
    logger.info("TikTok Image Queue Processor Starting")
    logger.info(f"Configuration: batch_size={BATCH_SIZE}, interval={BATCH_INTERVAL}s")
    logger.info("=" * 60)

    processor = BatchProcessor()

    try:
        processor.start()
    except KeyboardInterrupt:
        logger.info("Keyboard interrupt received")
    finally:
        stats = processor.get_stats()
        logger.info(f"Final stats: {stats}")


if __name__ == '__main__':
    main()
