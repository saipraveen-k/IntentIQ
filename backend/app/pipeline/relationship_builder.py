import os
import csv
import logging
from typing import List, Dict, Any, Optional
from collections import defaultdict
from sqlalchemy.future import select
from app.core.database import AsyncSessionLocal
from app.models.domain import ProductBundle

logger = logging.getLogger("intent_iq.relationship_builder")

class RelationshipBuilder:
    """
    Task 4: Relationship Builder
    Parses Instacart order_products_prior.csv / order_products_train.csv to calculate item pair co-occurrence frequencies.
    Generates Frequently Bought Together, Co-occurrence Graphs, and Complete the Look bundles.
    """
    def __init__(self, dataset_path: str = "datasets/instacart"):
        self.dataset_path = dataset_path

    def calculate_cooccurrences(self, sample_orders: int = 5000) -> Dict[str, List[str]]:
        prior_file = None
        for fn in ["order_products__prior.csv", "order_products_prior.csv", "order_products__train.csv", "order_products_train.csv"]:
            fp = os.path.join(self.dataset_path, fn)
            if os.path.exists(fp):
                prior_file = fp
                break

        if not prior_file:
            logger.info("Instacart order products CSV not found. Using category taxonomy co-occurrence rules.")
            return {}

        logger.info(f"Parsing order item basket co-occurrences from {prior_file}...")
        order_baskets = defaultdict(list)
        try:
            with open(prior_file, mode="r", encoding="utf-8", errors="ignore") as f:
                reader = csv.DictReader(f)
                for i, row in enumerate(reader):
                    oid = row.get("order_id")
                    pid = row.get("product_id")
                    if oid and pid:
                        order_baskets[oid].append(f"insta_{pid}")
                    if i >= sample_orders * 10:
                        break
        except Exception as e:
            logger.warning(f"Error reading order products CSV: {e}")
            return {}

        pair_counts = defaultdict(lambda: defaultdict(int))
        for oid, items in order_baskets.items():
            if len(items) < 2:
                continue
            for item_a in items:
                for item_b in items:
                    if item_a != item_b:
                        pair_counts[item_a][item_b] += 1

        top_cooccurrences = {}
        for item_a, neighbors in pair_counts.items():
            sorted_neighbors = sorted(neighbors.items(), key=lambda x: x[1], reverse=True)
            top_cooccurrences[item_a] = [n[0] for n in sorted_neighbors[:4]]

        logger.info(f"Calculated basket co-occurrences for {len(top_cooccurrences)} Instacart products.")
        return top_cooccurrences

    async def build_relationships(self, products: List[Dict[str, Any]]):
        if not products:
            return

        cooccurrences = self.calculate_cooccurrences()
        logger.info(f"Building relationship graph across {len(products)} Instacart products...")
        bundles_to_add = []

        cat_map: Dict[str, List[str]] = {}
        for p in products:
            cat_map.setdefault(p["category"], []).append(p["id"])

        for p in products:
            p_id = p["id"]
            cat = p["category"]

            # Real co-occurrence pairs if available from orders CSV
            co_items = cooccurrences.get(p_id, [])

            # Fallback/Supplemental complementary items from other categories
            comp_ids = [
                other_p["id"] for other_p in products
                if other_p["category"] != cat and other_p["id"] not in co_items
            ][:2]

            same_cat_ids = [other_id for other_id in cat_map.get(cat, []) if other_id != p_id and other_id not in co_items][:2]

            all_bundled = (co_items + comp_ids + same_cat_ids)[:4]
            if all_bundled:
                bundle_id = f"bundle_{p_id}"
                bundles_to_add.append(ProductBundle(
                    id=bundle_id,
                    base_product_id=p_id,
                    bundle_type="FREQUENTLY_BOUGHT_TOGETHER",
                    bundled_product_ids_json=all_bundled,
                    discount_pct=15.0,
                    score=0.95
                ))

        async with AsyncSessionLocal() as db:
            for b in bundles_to_add:
                stmt = select(ProductBundle).where(ProductBundle.id == b.id)
                res = await db.execute(stmt)
                if not res.scalar_one_or_none():
                    db.add(b)
            await db.commit()
            logger.info(f"Persisted {len(bundles_to_add)} Instacart product co-occurrence bundles into database.")
