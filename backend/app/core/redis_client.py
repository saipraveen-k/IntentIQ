import json
import logging
from typing import Optional, Any
from app.config import settings

logger = logging.getLogger("intent_iq.redis")

class InMemoryRedisFallback:
    def __init__(self):
        self._store = {}

    async def get(self, key: str) -> Optional[str]:
        return self._store.get(key)

    async def setex(self, key: str, time: int, value: str):
        self._store[key] = value

    async def delete(self, key: str):
        self._store.pop(key, None)

    async def flushdb(self):
        self._store.clear()

class RedisManager:
    def __init__(self):
        self.client = None
        self.use_fallback = False
        self.fallback = InMemoryRedisFallback()

    async def connect(self):
        try:
            import redis.asyncio as aioredis
            self.client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
            await self.client.ping()
            logger.info("Connected to Redis server successfully.")
        except Exception as e:
            logger.warning(f"Redis unavailable ({e}). Using in-memory fallback cache.")
            self.use_fallback = True
            self.client = self.fallback

    async def get_json(self, key: str) -> Optional[Any]:
        val = await self.client.get(key)
        if val:
            try:
                return json.loads(val)
            except Exception:
                return val
        return None

    async def set_json(self, key: str, value: Any, ttl: int = 1800):
        val_str = json.dumps(value)
        if self.use_fallback:
            await self.fallback.setex(key, ttl, val_str)
        else:
            await self.client.setex(key, ttl, val_str)

    async def delete_key(self, key: str):
        if self.use_fallback:
            await self.fallback.delete(key)
        else:
            await self.client.delete(key)

redis_manager = RedisManager()
