"""
API Key Manager - Handles rotation and usage tracking for Gemini API keys.
Tracks both RPM (requests per minute) and daily limits per key.
"""
import os
import time
from datetime import datetime, timedelta
from typing import Optional, List, Dict
import redis
import pytz
from dotenv import load_dotenv

load_dotenv()

from logging_config import get_logger

logger = get_logger('api_key_manager')

# Configuration
GEMINI_RPM_LIMIT = 18  # Safe limit (actual is ~20-25)
GEMINI_DAILY_LIMIT = 250  # Images per day per project
REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
REDIS_PORT = int(os.getenv('REDIS_PORT', '6379'))
REDIS_DB = int(os.getenv('REDIS_QUEUE_DB', '1'))  # Same DB as image queue

# Key prefixes in Redis
KEY_PREFIX = "gemini:key:"


class ApiKeyExhaustedError(Exception):
    """Raised when all API keys are exhausted."""
    pass


class ApiKeyManager:
    """
    Manages multiple Gemini API keys with automatic rotation.

    Features:
    - Round-robin selection with limit checking
    - RPM tracking (auto-expires after 60s)
    - Daily usage tracking (resets at midnight Pacific Time)
    - Redis-backed for persistence across restarts
    """

    def __init__(self, redis_client: Optional[redis.Redis] = None):
        """Initialize the manager."""
        # Load API keys
        keys_str = os.getenv('GEMINI_API_KEYS', '')
        if keys_str:
            self.keys = [k.strip() for k in keys_str.split(',') if k.strip()]
        else:
            # Fallback to single key
            single_key = os.getenv('GEMINI_API_KEY', '')
            self.keys = [single_key] if single_key else []

        if not self.keys:
            raise ValueError("No Gemini API keys configured. Set GEMINI_API_KEYS or GEMINI_API_KEY")

        # Redis connection
        if redis_client:
            self.redis = redis_client
        else:
            self.redis = redis.Redis(
                host=REDIS_HOST,
                port=REDIS_PORT,
                db=REDIS_DB,
                decode_responses=True
            )

        # Track last used key index for round-robin
        self._last_key_index = -1

        logger.info(f"ApiKeyManager initialized with {len(self.keys)} keys")

    def _get_key_id(self, key: str) -> str:
        """Get short ID for a key (first 8 chars)."""
        return key[:8]

    def _get_midnight_pt_timestamp(self) -> int:
        """Get Unix timestamp for next midnight Pacific Time."""
        pt = pytz.timezone('America/Los_Angeles')
        now_pt = datetime.now(pt)
        midnight_pt = (now_pt + timedelta(days=1)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        return int(midnight_pt.timestamp())

    def _get_seconds_until_midnight_pt(self) -> int:
        """Get seconds until midnight Pacific Time."""
        return self._get_midnight_pt_timestamp() - int(time.time())

    def get_key_usage(self, key: str) -> Dict:
        """
        Get current usage stats for a key.

        Returns:
            {
                'key_id': str (first 8 chars),
                'rpm_used': int,
                'rpm_limit': int,
                'daily_used': int,
                'daily_limit': int,
                'is_available': bool
            }
        """
        key_id = self._get_key_id(key)

        rpm_key = f"{KEY_PREFIX}{key_id}:rpm"
        daily_key = f"{KEY_PREFIX}{key_id}:daily"

        rpm_used = int(self.redis.get(rpm_key) or 0)
        daily_used = int(self.redis.get(daily_key) or 0)

        return {
            'key_id': key_id,
            'rpm_used': rpm_used,
            'rpm_limit': GEMINI_RPM_LIMIT,
            'daily_used': daily_used,
            'daily_limit': GEMINI_DAILY_LIMIT,
            'is_available': rpm_used < GEMINI_RPM_LIMIT and daily_used < GEMINI_DAILY_LIMIT
        }

    def get_all_keys_status(self) -> List[Dict]:
        """Get usage stats for all keys."""
        return [self.get_key_usage(key) for key in self.keys]

    def get_available_key(self) -> str:
        """
        Get the next available API key using round-robin with limit checking.

        Returns:
            API key string

        Raises:
            ApiKeyExhaustedError: If all keys are exhausted
        """
        # Try each key starting from last used + 1
        for i in range(len(self.keys)):
            idx = (self._last_key_index + 1 + i) % len(self.keys)
            key = self.keys[idx]
            usage = self.get_key_usage(key)

            if usage['is_available']:
                self._last_key_index = idx
                logger.debug(f"Selected key #{idx + 1} ({usage['key_id']}) | "
                           f"RPM: {usage['rpm_used']}/{usage['rpm_limit']} | "
                           f"Daily: {usage['daily_used']}/{usage['daily_limit']}")
                return key

        # All keys exhausted - log status
        status = self.get_all_keys_status()
        logger.error(f"All {len(self.keys)} API keys exhausted!")
        for i, s in enumerate(status):
            logger.error(f"  Key #{i + 1} ({s['key_id']}): "
                        f"RPM {s['rpm_used']}/{s['rpm_limit']}, "
                        f"Daily {s['daily_used']}/{s['daily_limit']}")

        raise ApiKeyExhaustedError(
            f"All {len(self.keys)} Gemini API keys exhausted. "
            f"RPM resets in <60s, daily resets at midnight PT."
        )

    def record_usage(self, key: str):
        """
        Record that a request was made with this key.
        Increments both RPM and daily counters.

        Args:
            key: The API key that was used
        """
        key_id = self._get_key_id(key)

        # Increment RPM counter (expires in 60 seconds)
        rpm_key = f"{KEY_PREFIX}{key_id}:rpm"
        self.redis.incr(rpm_key)
        self.redis.expire(rpm_key, 60)

        # Increment daily counter (expires at midnight PT)
        daily_key = f"{KEY_PREFIX}{key_id}:daily"
        self.redis.incr(daily_key)

        # Set expiry to midnight PT if not already set
        ttl = self.redis.ttl(daily_key)
        if ttl == -1:  # No expiry set
            seconds_until_midnight = self._get_seconds_until_midnight_pt()
            self.redis.expire(daily_key, seconds_until_midnight)

    def record_failure(self, key: str, is_rate_limit: bool = False):
        """
        Record that a request failed.
        If rate limit error, mark this key as temporarily exhausted.

        Args:
            key: The API key that failed
            is_rate_limit: Whether this was a 429 rate limit error
        """
        if is_rate_limit:
            key_id = self._get_key_id(key)
            # Set RPM to max to prevent using this key for 60s
            rpm_key = f"{KEY_PREFIX}{key_id}:rpm"
            self.redis.set(rpm_key, GEMINI_RPM_LIMIT)
            self.redis.expire(rpm_key, 60)
            logger.warning(f"Key {key_id} hit rate limit, marked exhausted for 60s")

    def get_summary(self) -> Dict:
        """
        Get overall summary of API key status.

        Returns:
            {
                'total_keys': int,
                'available_keys': int,
                'total_rpm_available': int,
                'total_daily_available': int,
                'keys': List[Dict]
            }
        """
        status = self.get_all_keys_status()
        available = [s for s in status if s['is_available']]

        total_rpm_available = sum(
            GEMINI_RPM_LIMIT - s['rpm_used']
            for s in status
        )
        total_daily_available = sum(
            GEMINI_DAILY_LIMIT - s['daily_used']
            for s in status
        )

        return {
            'total_keys': len(self.keys),
            'available_keys': len(available),
            'total_rpm_available': total_rpm_available,
            'total_daily_available': total_daily_available,
            'seconds_until_daily_reset': self._get_seconds_until_midnight_pt(),
            'keys': status
        }

    def reset_key(self, key_id: str):
        """
        Manually reset a key's counters (admin function).

        Args:
            key_id: First 8 chars of the key to reset
        """
        rpm_key = f"{KEY_PREFIX}{key_id}:rpm"
        daily_key = f"{KEY_PREFIX}{key_id}:daily"
        self.redis.delete(rpm_key, daily_key)
        logger.info(f"Manually reset counters for key {key_id}")

    def reset_all_keys(self):
        """Manually reset all key counters (admin function)."""
        for key in self.keys:
            self.reset_key(self._get_key_id(key))
        logger.info("Manually reset all API key counters")


# Global singleton instance
_manager: Optional[ApiKeyManager] = None


def get_api_key_manager() -> ApiKeyManager:
    """Get or create the global ApiKeyManager instance."""
    global _manager
    if _manager is None:
        _manager = ApiKeyManager()
    return _manager
