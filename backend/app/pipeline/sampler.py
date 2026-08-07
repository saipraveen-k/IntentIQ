import random
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("intent_iq.sampler")

class SamplingEngine:
    """
    Module 5: Sampling Engine
    Applies configurable sample sizes, category filtering, and balanced sampling strategies.
    Ensures memory-efficient execution without requiring full dataset loads into RAM.
    """
    def __init__(self, default_sample_size: int = 1000, seed: int = 42):
        self.default_sample_size = default_sample_size
        self.seed = seed
        random.seed(seed)

    def sample_records(
        self,
        records: List[Dict[str, Any]],
        sample_size: Optional[int] = None,
        category_filter: Optional[str] = None,
        balanced_categories: bool = True
    ) -> List[Dict[str, Any]]:
        target_size = sample_size or self.default_sample_size
        
        # Category filtering if specified
        if category_filter:
            records = [r for r in records if category_filter.lower() in r.get("category", "").lower()]

        if len(records) <= target_size:
            return records

        if not balanced_categories:
            return random.sample(records, target_size)

        # Balanced sampling across categories
        cat_map: Dict[str, List[Dict[str, Any]]] = {}
        for r in records:
            cat = r.get("category", "General")
            cat_map.setdefault(cat, []).append(r)

        sampled_results = []
        num_categories = len(cat_map)
        per_cat_quota = max(1, target_size // max(1, num_categories))

        for cat, items in cat_map.items():
            take_count = min(len(items), per_cat_quota)
            sampled_results.extend(random.sample(items, take_count))

        # Fill remaining if needed
        if len(sampled_results) < target_size:
            remaining_pool = [r for r in records if r not in sampled_results]
            needed = min(target_size - len(sampled_results), len(remaining_pool))
            if needed > 0:
                sampled_results.extend(random.sample(remaining_pool, needed))

        random.shuffle(sampled_results)
        logger.info(f"Sampled {len(sampled_results)} items from pool of {len(records)} records.")
        return sampled_results
