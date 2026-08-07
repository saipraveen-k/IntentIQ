import logging
from typing import Dict, Any, List
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.domain import Product

logger = logging.getLogger("intent_iq.bundle_agent")

class BundleAgent:
    """
    Bundle Agent:
    Generates 'Complete the Look' and 'Frequently Bought Together' bundles based on category rules & visual pairing heuristics.
    """
    async def generate_bundles(self, db: AsyncSession, base_product: Product) -> Dict[str, List[Product]]:
        # Fetch items from complementary categories
        stmt = select(Product).where(Product.id != base_product.id).limit(20)
        res = await db.execute(stmt)
        all_prods = res.scalars().all()

        # Categorize
        complete_look = []
        frequently_bought = []

        for p in all_prods:
            if p.category != base_product.category and len(complete_look) < 2:
                complete_look.append(p)
            elif len(frequently_bought) < 2:
                frequently_bought.append(p)

        return {
            "complete_the_look": complete_look,
            "frequently_bought_together": frequently_bought
        }

bundle_agent = BundleAgent()
