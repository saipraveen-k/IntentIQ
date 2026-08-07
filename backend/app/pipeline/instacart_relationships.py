import logging
from typing import List, Dict, Any
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.domain import Product

logger = logging.getLogger("intent_iq.instacart_relationships")

class InstacartRelationshipEngine:
    """
    Phase 1, 2 & Phase 6 Requirement:
    Derive deeper item relationships from the Instacart catalog:
    - Substitutes (same category/aisle, similar price)
    - Premium Alternatives (higher price in same category)
    - Budget Alternatives (lower price in same category)
    - Healthier Alternatives (organic/fresh items in same aisle)
    - Complementary Products (co-occurrence graph edges)
    """
    async def get_product_relationships(self, base_prod: Product, db: AsyncSession) -> Dict[str, List[Product]]:
        cat = base_prod.category
        price = base_prod.price
        
        # Query same category products
        stmt = select(Product).where(Product.category == cat, Product.id != base_prod.id).limit(20)
        same_cat_prods = (await db.execute(stmt)).scalars().all()
        
        substitutes = []
        premium = []
        budget = []
        healthy = []
        
        for p in same_cat_prods:
            if abs(p.price - price) <= price * 0.25 and len(substitutes) < 3:
                substitutes.append(p)
            elif p.price > price * 1.15 and len(premium) < 3:
                premium.append(p)
            elif p.price < price * 0.85 and len(budget) < 3:
                budget.append(p)
            
            if ("Organic" in p.title or "Fresh" in p.title or "Raw" in p.title) and len(healthy) < 3:
                healthy.append(p)
                
        return {
            "substitutes": substitutes,
            "premium_alternatives": premium,
            "budget_alternatives": budget,
            "healthy_alternatives": healthy
        }

instacart_relationship_engine = InstacartRelationshipEngine()
