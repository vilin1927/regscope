"""
Global Image Queue System
Redis-backed queue for batch processing of Gemini image generation.
Configuration is loaded from config.py.
"""
import os
import json
import time
import threading
from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

load_dotenv()

import redis

from logging_config import get_logger
from config import QueueConfig, RedisConfig

logger = get_logger('image_queue')

# Redis configuration (from config module)
REDIS_HOST = RedisConfig.HOST
REDIS_PORT = RedisConfig.PORT
REDIS_DB = RedisConfig.QUEUE_DB

# Queue configuration (from config module)
BATCH_SIZE = QueueConfig.BATCH_SIZE
BATCH_INTERVAL = QueueConfig.BATCH_INTERVAL
MAX_RETRIES = QueueConfig.MAX_RETRIES

# TTL configuration (from config module)
TASK_DATA_TTL = QueueConfig.TASK_DATA_TTL
JOB_DATA_TTL = QueueConfig.JOB_DATA_TTL
RESULT_TTL = QueueConfig.RESULT_TTL


@dataclass
class ImageTask:
    """Represents a single image generation task in the queue."""
    task_id: str              # Unique: "{job_id}_{slide_key}_p{n}_t{n}"
    job_id: str               # Parent job ID
    job_type: str             # "single" or "batch"

    # Dependency info
    dependency_group: str = ""     # e.g., "job123_persona"
    dependency_type: str = "none"  # "none", "persona_first", "persona_dependent"
    depends_on_task_id: str = ""   # Task that must complete first

    # Generation parameters
    slide_type: str = ""           # "hook", "body", "product"
    slide_index: int = 0           # Original slide index
    scene_description: str = ""
    text_content: str = ""
    text_position_hint: str = ""
    reference_image_path: str = ""
    product_image_path: str = ""
    persona_reference_path: str = ""  # Set after persona_first completes
    has_persona: bool = False
    text_style: Dict[str, Any] = field(default_factory=dict)
    visual_style: Dict[str, Any] = field(default_factory=dict)
    persona_info: Dict[str, Any] = field(default_factory=dict)  # Demographics for new persona creation
    clean_image_mode: bool = False
    product_description: str = ""
    shows_product_on_face: bool = False  # Per-slide flag: original slide shows face tape/patches
    transformation_role: str = ""  # "before", "after", or "" - for transformation slides
    transformation_problem: str = ""  # "under_eye", "forehead_lines", etc. - specific problem type
    layout_type: str = "single"  # "single" or "split_screen"
    split_config: Dict[str, Any] = field(default_factory=dict)  # {"orientation": "horizontal", "sections": ["before", "after"], "is_transformation": true}
    version: int = 1               # For variation diversity

    # Output
    output_path: str = ""
    output_dir: str = ""

    # Retry tracking
    retry_count: int = 0
    last_error: str = ""

    # Timestamps (stored as ISO strings for JSON serialization)
    created_at: str = ""
    started_at: str = ""
    completed_at: str = ""

    def to_dict(self) -> dict:
        """Convert to dictionary for Redis storage."""
        data = asdict(self)
        # Convert text_style, visual_style, persona_info, and split_config dicts to JSON strings
        data['text_style'] = json.dumps(data['text_style'])
        data['visual_style'] = json.dumps(data['visual_style'])
        data['persona_info'] = json.dumps(data['persona_info'])
        data['split_config'] = json.dumps(data['split_config'])
        # Convert booleans to strings and None to empty strings (Redis doesn't accept booleans or None)
        for key, value in data.items():
            if value is None:
                data[key] = ''  # Redis can't store None
            elif isinstance(value, bool):
                data[key] = 'true' if value else 'false'
        return data

    @classmethod
    def from_dict(cls, data: dict) -> 'ImageTask':
        """Create from dictionary (Redis retrieval)."""
        # Convert text_style JSON string back to dict
        if isinstance(data.get('text_style'), str):
            try:
                data['text_style'] = json.loads(data['text_style'])
            except (json.JSONDecodeError, TypeError):
                data['text_style'] = {}
        # Convert visual_style JSON string back to dict
        if isinstance(data.get('visual_style'), str):
            try:
                data['visual_style'] = json.loads(data['visual_style'])
            except (json.JSONDecodeError, TypeError):
                data['visual_style'] = {}
        # Convert persona_info JSON string back to dict
        if isinstance(data.get('persona_info'), str):
            try:
                data['persona_info'] = json.loads(data['persona_info'])
            except (json.JSONDecodeError, TypeError):
                data['persona_info'] = {}
        # Convert split_config JSON string back to dict
        if isinstance(data.get('split_config'), str):
            try:
                data['split_config'] = json.loads(data['split_config'])
            except (json.JSONDecodeError, TypeError):
                data['split_config'] = {}
        # Convert boolean strings
        if isinstance(data.get('has_persona'), str):
            data['has_persona'] = data['has_persona'].lower() == 'true'
        if isinstance(data.get('clean_image_mode'), str):
            data['clean_image_mode'] = data['clean_image_mode'].lower() == 'true'
        if isinstance(data.get('shows_product_on_face'), str):
            data['shows_product_on_face'] = data['shows_product_on_face'].lower() == 'true'
        # Convert integers
        for int_field in ['slide_index', 'retry_count', 'version']:
            if isinstance(data.get(int_field), str):
                data[int_field] = int(data[int_field]) if data[int_field] else 0
        return cls(**data)


class GlobalImageQueue:
    """
    Redis-backed global queue for image generation tasks.

    Features:
    - FIFO ordering (pure first-in-first-out)
    - Persona dependency handling
    - Retry queue for failed images
    - Job status tracking
    - Persistent across restarts
    """

    # Redis key prefixes
    PENDING_KEY = "image_queue:pending"           # Sorted set (score = timestamp for FIFO)
    PROCESSING_KEY = "image_queue:processing"     # Set of currently processing task IDs
    RETRY_KEY = "image_queue:retry"               # Sorted set (score = timestamp for FIFO)
    COMPLETED_KEY = "image_queue:completed"       # Set of completed task IDs
    FAILED_KEY = "image_queue:failed"             # Set of permanently failed task IDs
    TASK_DATA_PREFIX = "image_queue:task:"        # Hash for task data
    JOB_TASKS_PREFIX = "image_queue:job:"         # Set of task IDs per job
    JOB_STATUS_PREFIX = "image_queue:job_status:" # Hash for job status
    RESULTS_PREFIX = "image_queue:results:"       # String for task results (output path)
    DEPENDENCY_PREFIX = "image_queue:dep:"        # Hash for dependency resolution
    STATS_KEY = "image_queue:stats"               # Hash for global stats

    def __init__(self, redis_client: Optional[redis.Redis] = None):
        """Initialize queue with Redis connection."""
        if redis_client:
            self.redis = redis_client
        else:
            self.redis = redis.Redis(
                host=REDIS_HOST,
                port=REDIS_PORT,
                db=REDIS_DB,
                decode_responses=True
            )
        self._lock = threading.Lock()
        logger.info(f"GlobalImageQueue initialized: redis={REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}")

    def submit(self, task: ImageTask) -> str:
        """
        Add task to queue with FIFO ordering.

        Args:
            task: ImageTask to submit

        Returns:
            task_id
        """
        # Set creation timestamp
        task.created_at = datetime.utcnow().isoformat()

        # Use timestamp as score for pure FIFO
        score = time.time()

        # Store task data with TTL
        task_key = f"{self.TASK_DATA_PREFIX}{task.task_id}"
        self.redis.hset(task_key, mapping=task.to_dict())
        self.redis.expire(task_key, TASK_DATA_TTL)

        # Add to pending queue (sorted by timestamp = FIFO)
        self.redis.zadd(self.PENDING_KEY, {task.task_id: score})

        # Track job -> tasks mapping
        job_tasks_key = f"{self.JOB_TASKS_PREFIX}{task.job_id}"
        self.redis.sadd(job_tasks_key, task.task_id)

        # Initialize/update job status
        self._update_job_status(task.job_id)

        # Track dependency if this is a persona_first task
        if task.dependency_type == "persona_first":
            dep_key = f"{self.DEPENDENCY_PREFIX}{task.dependency_group}"
            self.redis.hset(dep_key, mapping={
                'first_task_id': task.task_id,
                'completed': 'false',
                'result_path': ''
            })

        logger.debug(f"Submitted task {task.task_id} for job {task.job_id}")
        return task.task_id

    def get_batch(self, limit: int = BATCH_SIZE) -> List[ImageTask]:
        """
        Get next batch of tasks in FIFO order, respecting dependencies.

        Args:
            limit: Maximum tasks to return (default: 18)

        Returns:
            List of ImageTask objects ready for processing
        """
        tasks = []
        skipped_deps = set()  # Track skipped dependency groups

        with self._lock:
            # First, check retry queue (retries get priority to clear backlog)
            retry_ids = self.redis.zrange(self.RETRY_KEY, 0, limit - 1)
            for task_id in retry_ids:
                if len(tasks) >= limit:
                    break
                task = self._get_task(task_id)
                if task and self._can_process_task(task, skipped_deps):
                    tasks.append(task)
                    # Move from retry to processing
                    self.redis.zrem(self.RETRY_KEY, task_id)
                    self.redis.sadd(self.PROCESSING_KEY, task_id)
                    task.started_at = datetime.utcnow().isoformat()
                    self._save_task(task)

            # Then, fill remaining slots from pending queue (FIFO)
            remaining = limit - len(tasks)
            if remaining > 0:
                # Get more than needed to account for skipped dependencies
                pending_ids = self.redis.zrange(self.PENDING_KEY, 0, remaining * 2)
                for task_id in pending_ids:
                    if len(tasks) >= limit:
                        break
                    task = self._get_task(task_id)
                    if task and self._can_process_task(task, skipped_deps):
                        tasks.append(task)
                        # Move from pending to processing
                        self.redis.zrem(self.PENDING_KEY, task_id)
                        self.redis.sadd(self.PROCESSING_KEY, task_id)
                        task.started_at = datetime.utcnow().isoformat()
                        self._save_task(task)

        if tasks:
            logger.info(f"Retrieved batch of {len(tasks)} tasks (skipped {len(skipped_deps)} blocked deps)")

        return tasks

    def _can_process_task(self, task: ImageTask, skipped_deps: set) -> bool:
        """
        Check if task can be processed (dependencies satisfied).

        Args:
            task: Task to check
            skipped_deps: Set of dependency groups already skipped

        Returns:
            True if task can be processed
        """
        if task.dependency_type == "persona_dependent":
            # Check if the persona_first task has completed
            dep_key = f"{self.DEPENDENCY_PREFIX}{task.dependency_group}"
            dep_info = self.redis.hgetall(dep_key)

            if not dep_info or dep_info.get('completed') != 'true':
                # Dependency not satisfied - skip this task
                skipped_deps.add(task.dependency_group)
                return False

            # Update task with persona reference path
            task.persona_reference_path = dep_info.get('result_path', '')

        return True

    def mark_complete(self, task_id: str, result_path: str):
        """
        Mark task as completed successfully.

        Args:
            task_id: Task ID
            result_path: Path to generated image
        """
        task = self._get_task(task_id)
        if not task:
            logger.warning(f"Cannot mark complete: task {task_id} not found")
            return

        # Update task
        task.completed_at = datetime.utcnow().isoformat()
        task.output_path = result_path
        self._save_task(task)

        # Move from processing to completed
        self.redis.srem(self.PROCESSING_KEY, task_id)
        self.redis.sadd(self.COMPLETED_KEY, task_id)

        # Store result with TTL
        result_key = f"{self.RESULTS_PREFIX}{task_id}"
        self.redis.set(result_key, result_path)
        self.redis.expire(result_key, RESULT_TTL)

        # Update dependency if this was a persona_first task
        if task.dependency_type == "persona_first":
            dep_key = f"{self.DEPENDENCY_PREFIX}{task.dependency_group}"
            self.redis.hset(dep_key, mapping={
                'completed': 'true',
                'result_path': result_path
            })
            logger.info(f"Persona dependency {task.dependency_group} satisfied with {result_path}")

        # Update job status
        self._update_job_status(task.job_id)

        logger.debug(f"Task {task_id} completed: {result_path}")

    def mark_failed(self, task_id: str, error: str, is_rate_limit: bool = False, permanent: bool = False):
        """
        Mark task as failed. Moves to retry queue if retries remaining.

        Args:
            task_id: Task ID
            error: Error message
            is_rate_limit: If True, don't count against retry limit
            permanent: If True, mark as permanent failure immediately (no retries)
        """
        task = self._get_task(task_id)
        if not task:
            logger.warning(f"Cannot mark failed: task {task_id} not found")
            return

        # Remove from processing
        self.redis.srem(self.PROCESSING_KEY, task_id)

        # Update retry count (unless rate limit error)
        if not is_rate_limit and not permanent:
            task.retry_count += 1

        task.last_error = error
        self._save_task(task)

        if permanent or task.retry_count >= MAX_RETRIES:
            # Permanent failure
            self.redis.sadd(self.FAILED_KEY, task_id)
            logger.error(f"Task {task_id} permanently failed after {MAX_RETRIES} attempts: {error}")

            # CRITICAL: If this was a persona_first task, fail all dependent tasks
            # This prevents deadlock where dependents wait forever for a failed dependency
            if task.dependency_type == "persona_first":
                self._fail_dependent_tasks(task.dependency_group, f"Dependency {task_id} failed: {error}")
        else:
            # Add to retry queue (will be picked up in next batch)
            score = time.time()
            self.redis.zadd(self.RETRY_KEY, {task_id: score})
            logger.warning(f"Task {task_id} failed (attempt {task.retry_count}/{MAX_RETRIES}): {error}")

        # Update job status
        self._update_job_status(task.job_id)

    def get_job_status(self, job_id: str) -> dict:
        """
        Get current status of a job.

        Returns:
            {
                'job_id': str,
                'total': int,
                'pending': int,
                'processing': int,
                'completed': int,
                'failed': int,
                'retry': int,
                'is_complete': bool,
                'results': List[str]  # Paths to completed images
            }
        """
        status_key = f"{self.JOB_STATUS_PREFIX}{job_id}"
        status = self.redis.hgetall(status_key)

        if not status:
            return {
                'job_id': job_id,
                'total': 0,
                'pending': 0,
                'processing': 0,
                'completed': 0,
                'failed': 0,
                'retry': 0,
                'is_complete': True,
                'results': []
            }

        # Convert string counts to int
        for key in ['total', 'pending', 'processing', 'completed', 'failed', 'retry']:
            status[key] = int(status.get(key, 0))

        status['is_complete'] = (
            status['pending'] == 0 and
            status['processing'] == 0 and
            status['retry'] == 0
        )

        # Get results
        status['results'] = self.get_job_results(job_id)

        return status

    def get_job_results(self, job_id: str) -> List[str]:
        """
        Get all completed image paths for a job.

        Returns:
            List of output paths
        """
        job_tasks_key = f"{self.JOB_TASKS_PREFIX}{job_id}"
        task_ids = self.redis.smembers(job_tasks_key)

        results = []
        for task_id in task_ids:
            result = self.redis.get(f"{self.RESULTS_PREFIX}{task_id}")
            if result:
                results.append(result)

        return results

    def is_job_complete(self, job_id: str) -> bool:
        """Check if all tasks for a job are complete (or failed)."""
        status = self.get_job_status(job_id)
        return status['is_complete']

    def cancel_job(self, job_id: str) -> dict:
        """
        Cancel a job and remove all its tasks from queues.

        Returns:
            {'cancelled': int, 'processing': int}
        """
        job_tasks_key = f"{self.JOB_TASKS_PREFIX}{job_id}"
        task_ids = self.redis.smembers(job_tasks_key)

        cancelled = 0
        still_processing = 0

        for task_id in task_ids:
            # Remove from pending
            removed = self.redis.zrem(self.PENDING_KEY, task_id)
            if removed:
                cancelled += 1
                continue

            # Remove from retry
            removed = self.redis.zrem(self.RETRY_KEY, task_id)
            if removed:
                cancelled += 1
                continue

            # Check if processing (can't cancel mid-flight)
            if self.redis.sismember(self.PROCESSING_KEY, task_id):
                still_processing += 1

        logger.info(f"Job {job_id} cancelled: {cancelled} tasks removed, {still_processing} still processing")

        return {'cancelled': cancelled, 'processing': still_processing}

    def get_queue_stats(self) -> dict:
        """
        Get global queue statistics.

        Returns:
            {
                'pending': int,
                'processing': int,
                'retry': int,
                'completed': int,
                'failed': int,
                'total_jobs': int
            }
        """
        return {
            'pending': self.redis.zcard(self.PENDING_KEY),
            'processing': self.redis.scard(self.PROCESSING_KEY),
            'retry': self.redis.zcard(self.RETRY_KEY),
            'completed': self.redis.scard(self.COMPLETED_KEY),
            'failed': self.redis.scard(self.FAILED_KEY),
            'total_jobs': len(self.redis.keys(f"{self.JOB_TASKS_PREFIX}*"))
        }

    def _get_task(self, task_id: str) -> Optional[ImageTask]:
        """Retrieve task data from Redis."""
        task_key = f"{self.TASK_DATA_PREFIX}{task_id}"
        data = self.redis.hgetall(task_key)
        if not data:
            return None
        return ImageTask.from_dict(data)

    def _save_task(self, task: ImageTask):
        """Save task data to Redis."""
        task_key = f"{self.TASK_DATA_PREFIX}{task.task_id}"
        self.redis.hset(task_key, mapping=task.to_dict())

    def _update_job_status(self, job_id: str):
        """Update job status counts."""
        job_tasks_key = f"{self.JOB_TASKS_PREFIX}{job_id}"
        task_ids = self.redis.smembers(job_tasks_key)

        counts = {
            'total': len(task_ids),
            'pending': 0,
            'processing': 0,
            'completed': 0,
            'failed': 0,
            'retry': 0
        }

        for task_id in task_ids:
            if self.redis.sismember(self.COMPLETED_KEY, task_id):
                counts['completed'] += 1
            elif self.redis.sismember(self.FAILED_KEY, task_id):
                counts['failed'] += 1
            elif self.redis.sismember(self.PROCESSING_KEY, task_id):
                counts['processing'] += 1
            elif self.redis.zscore(self.RETRY_KEY, task_id) is not None:
                counts['retry'] += 1
            elif self.redis.zscore(self.PENDING_KEY, task_id) is not None:
                counts['pending'] += 1

        status_key = f"{self.JOB_STATUS_PREFIX}{job_id}"
        self.redis.hset(status_key, mapping={k: str(v) for k, v in counts.items()})
        self.redis.expire(status_key, JOB_DATA_TTL)

    def _fail_dependent_tasks(self, dependency_group: str, error: str):
        """
        Fail all tasks that depend on a failed persona_first task.
        Prevents deadlock where dependents wait forever for a failed dependency.

        Args:
            dependency_group: The dependency group (e.g., "job123_persona")
            error: Error message to assign to failed tasks
        """
        failed_count = 0

        # Find all pending tasks in this dependency group
        pending_ids = self.redis.zrange(self.PENDING_KEY, 0, -1)
        for task_id in pending_ids:
            task = self._get_task(task_id)
            if task and task.dependency_group == dependency_group and task.dependency_type == "persona_dependent":
                # Move from pending to failed
                self.redis.zrem(self.PENDING_KEY, task_id)
                self.redis.sadd(self.FAILED_KEY, task_id)
                task.last_error = error
                self._save_task(task)
                failed_count += 1

        # Also check retry queue
        retry_ids = self.redis.zrange(self.RETRY_KEY, 0, -1)
        for task_id in retry_ids:
            task = self._get_task(task_id)
            if task and task.dependency_group == dependency_group and task.dependency_type == "persona_dependent":
                self.redis.zrem(self.RETRY_KEY, task_id)
                self.redis.sadd(self.FAILED_KEY, task_id)
                task.last_error = error
                self._save_task(task)
                failed_count += 1

        if failed_count > 0:
            logger.warning(f"Failed {failed_count} dependent tasks for group {dependency_group}")

            # Update job status for affected jobs
            for task_id in pending_ids + retry_ids:
                task = self._get_task(task_id)
                if task and task.dependency_group == dependency_group:
                    self._update_job_status(task.job_id)
                    break  # Only need to update once per job

    def cleanup_job(self, job_id: str):
        """
        Clean up all Redis keys for a completed job.
        Call after job results have been collected.
        """
        job_tasks_key = f"{self.JOB_TASKS_PREFIX}{job_id}"
        task_ids = self.redis.smembers(job_tasks_key)

        # Delete task data and results
        for task_id in task_ids:
            self.redis.delete(f"{self.TASK_DATA_PREFIX}{task_id}")
            self.redis.delete(f"{self.RESULTS_PREFIX}{task_id}")
            self.redis.srem(self.COMPLETED_KEY, task_id)
            self.redis.srem(self.FAILED_KEY, task_id)

        # Delete job tracking
        self.redis.delete(job_tasks_key)
        self.redis.delete(f"{self.JOB_STATUS_PREFIX}{job_id}")

        logger.info(f"Cleaned up job {job_id}: {len(task_ids)} tasks removed")


# Global singleton instance
_global_queue: Optional[GlobalImageQueue] = None
_queue_lock = threading.Lock()


def get_global_queue() -> GlobalImageQueue:
    """Get or create the global queue instance (singleton)."""
    global _global_queue
    with _queue_lock:
        if _global_queue is None:
            _global_queue = GlobalImageQueue()
        return _global_queue
