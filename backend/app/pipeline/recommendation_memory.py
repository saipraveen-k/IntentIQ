import time
import logging
from typing import List, Dict, Any, Set, Optional

logger = logging.getLogger("intent_iq.recommendation_memory")

class BoundedSessionMemory:
    def __init__(self):
        self.viewed_products: List[str] = [] # Max 20
        self.searches: List[str] = [] # Max 10
        self.served_recommendations: List[str] = [] # Max 20
        self.cooldown_timestamps: Dict[str, float] = {} # SKU -> expire timestamp
        self.ignored_timestamps: Dict[str, float] = {} # SKU -> expire timestamp
        self.positive_signals: Set[str] = set()
        self.negative_signals: Set[str] = set()
        self.favorite_departments: Dict[str, int] = {}
        self.preferred_brands: Dict[str, int] = {}
        self.price_range: Dict[str, float] = {"min": 0.0, "max": 1000.0}

    def record_view(self, product_id: str, department: Optional[str] = None, brand: Optional[str] = None, cooldown_minutes: float = 15.0):
        if product_id in self.viewed_products:
            self.viewed_products.remove(product_id)
        self.viewed_products.append(product_id)
        if len(self.viewed_products) > 20:
            self.viewed_products.pop(0)

        now = time.time()
        self.cooldown_timestamps[product_id] = now + (cooldown_minutes * 60.0)
        self.positive_signals.add(product_id)
        if department:
            self.favorite_departments[department] = self.favorite_departments.get(department, 0) + 1
        if brand:
            self.preferred_brands[brand] = self.preferred_brands.get(brand, 0) + 1

    def record_search(self, query: str):
        if query in self.searches:
            self.searches.remove(query)
        self.searches.append(query)
        if len(self.searches) > 10:
            self.searches.pop(0)

    def record_served_recommendations(self, product_ids: List[str], cooldown_minutes: float = 15.0):
        now = time.time()
        cooldown_sec = cooldown_minutes * 60.0
        for pid in product_ids:
            if pid in self.served_recommendations:
                self.served_recommendations.remove(pid)
            self.served_recommendations.append(pid)
            self.cooldown_timestamps[pid] = now + cooldown_sec

        while len(self.served_recommendations) > 20:
            self.served_recommendations.pop(0)

    def is_in_cooldown(self, product_id: str) -> bool:
        now = time.time()
        # Clean expired
        if product_id in self.cooldown_timestamps:
            if now > self.cooldown_timestamps[product_id]:
                del self.cooldown_timestamps[product_id]
                return False
            return True
        return False

    def clean_expired(self):
        now = time.time()
        self.cooldown_timestamps = {k: v for k, v in self.cooldown_timestamps.items() if v > now}
        self.ignored_timestamps = {k: v for k, v in self.ignored_timestamps.items() if v > now}

class RecommendationMemoryManager:
    def __init__(self):
        self._sessions: Dict[str, BoundedSessionMemory] = {}

    def get_memory(self, session_id: str) -> BoundedSessionMemory:
        if session_id not in self._sessions:
            self._sessions[session_id] = BoundedSessionMemory()
        mem = self._sessions[session_id]
        mem.clean_expired()
        return mem

recommendation_memory_manager = RecommendationMemoryManager()
