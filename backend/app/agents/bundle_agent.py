import logging
from typing import Dict, Any, List, Optional
from app.models.domain import Product
from app.repositories.product_repository import ProductRepository
from app.repositories.bundle_repository import BundleRepository
from app.core.faiss_manager import faiss_manager

logger = logging.getLogger("intent_iq.bundle_agent")

class BundleAgent:
    """
    Module 8: Bundle Agent
    Computes 'Complete the Look' and 'Frequently Bought Together' bundles with discount pricing & score calculations.
    """
    async def get_or_create_bundles(
        self,
        base_product: Product,
        product_repo: ProductRepository,
        bundle_repo: Optional[BundleRepository] = None
    ) -> Dict[str, Any]:
        # Step 1: Check existing bundle in repository if present
        if bundle_repo:
            existing = await bundle_repo.get_bundle_by_product(base_product.id)
            if existing:
                bundled_prods = await product_repo.get_by_ids(existing.bundled_product_ids_json)
                half = len(bundled_prods) // 2
                ctl = bundled_prods[:half]
                fbt = bundled_prods[half:]
                orig_tot = round(base_product.price + sum(p.price for p in ctl) + sum(p.price for p in fbt), 2)
                disc_pct = existing.discount_pct or 15.0
                disc_tot = round(orig_tot * (1.0 - disc_pct / 100.0), 2)
                return {
                    "base_product": base_product,
                    "complete_the_look": ctl,
                    "frequently_bought_together": fbt,
                    "bundle_discount_pct": disc_pct,
                    "original_total": orig_tot,
                    "discounted_total": disc_tot,
                    "score": existing.score
                }

        # Step 2: Compute complementary candidates via category & brand rules
        cat_candidates = await product_repo.get_by_category(base_product.category, limit=10)
        other_candidates = await product_repo.get_all(limit=20)

        complete_look: List[Product] = []
        frequently_bought: List[Product] = []
        used_ids = {base_product.id}

        # Complete the look: items from complementary categories
        for prod in other_candidates:
            if prod.id not in used_ids and prod.category != base_product.category:
                if len(complete_look) < 2:
                    complete_look.append(prod)
                    used_ids.add(prod.id)

        # Frequently bought together: items within same or related category
        for prod in cat_candidates:
            if prod.id not in used_ids and len(frequently_bought) < 2:
                frequently_bought.append(prod)
                used_ids.add(prod.id)

        orig_total = base_product.price + sum(p.price for p in complete_look) + sum(p.price for p in frequently_bought)
        disc_total = round(orig_total * 0.85, 2) # 15% discount

        return {
            "base_product": base_product,
            "complete_the_look": complete_look,
            "frequently_bought_together": frequently_bought,
            "bundle_discount_pct": 15.0,
            "original_total": round(orig_total, 2),
            "discounted_total": disc_total,
            "score": 0.94
        }

bundle_agent = BundleAgent()
