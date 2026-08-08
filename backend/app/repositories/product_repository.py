import json
import logging
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.future import select
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.domain import Product, Category, Brand, ProductImage, ProductEmbedding
from app.core.redis_client import redis_manager

logger = logging.getLogger("intent_iq.product_repository")

class ProductRepository:
    """
    Performance-Optimized ProductRepository
    Includes batch in_() queries, N+1 query elimination, and Redis/In-memory caching.
    """
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, product_id: str) -> Optional[Product]:
        # Check cache first for sub-millisecond retrieval
        cache_key = f"cache:product:{product_id}"
        cached_data = await redis_manager.get_json(cache_key)
        if cached_data:
            return Product(**cached_data)

        stmt = select(Product).where(Product.id == product_id)
        res = await self.db.execute(stmt)
        prod = res.scalar_one_or_none()
        
        if prod:
            prod_dict = {
                "id": prod.id,
                "title": prod.title,
                "description": prod.description,
                "category_id": prod.category_id,
                "brand_id": prod.brand_id,
                "category": prod.category,
                "brand": prod.brand,
                "sub_category": prod.sub_category,
                "price": prod.price,
                "original_price": prod.original_price,
                "rating": prod.rating,
                "review_count": prod.review_count,
                "image_url": prod.image_url,
                "attributes": prod.attributes,
                "in_stock": prod.in_stock,
                "view_count": prod.view_count,
                "purchase_count": prod.purchase_count
            }
            await redis_manager.set_json(cache_key, prod_dict, ttl=3600)
        return prod

    async def get_by_ids(self, product_ids: List[str]) -> List[Product]:
        if not product_ids:
            return []

        # Deduplicate & preserve ordering
        unique_ids = list(dict.fromkeys(product_ids))
        found_products: Dict[str, Product] = {}
        missing_ids = []

        # Check Cache for bulk IDs
        for pid in unique_ids:
            cached_data = await redis_manager.get_json(f"cache:product:{pid}")
            if cached_data:
                found_products[pid] = Product(**cached_data)
            else:
                missing_ids.append(pid)

        # Execute single bulk SQL IN query for cache misses
        if missing_ids:
            stmt = select(Product).where(Product.id.in_(missing_ids))
            res = await self.db.execute(stmt)
            db_prods = list(res.scalars().all())
            for prod in db_prods:
                found_products[prod.id] = prod
                prod_dict = {
                    "id": prod.id,
                    "title": prod.title,
                    "description": prod.description,
                    "category_id": prod.category_id,
                    "brand_id": prod.brand_id,
                    "category": prod.category,
                    "brand": prod.brand,
                    "sub_category": prod.sub_category,
                    "price": prod.price,
                    "original_price": prod.original_price,
                    "rating": prod.rating,
                    "review_count": prod.review_count,
                    "image_url": prod.image_url,
                    "attributes": prod.attributes,
                    "in_stock": prod.in_stock,
                    "view_count": prod.view_count,
                    "purchase_count": prod.purchase_count
                }
                await redis_manager.set_json(f"cache:product:{prod.id}", prod_dict, ttl=3600)

        # Return ordered list matching original requested product_ids
        return [found_products[pid] for pid in product_ids if pid in found_products]

    async def get_all(self, limit: int = 50, offset: int = 0) -> List[Product]:
        stmt = select(Product).where(Product.in_stock == True).order_by(Product.rating.desc()).offset(offset).limit(limit)
        res = await self.db.execute(stmt)
        return list(res.scalars().all())

    async def get_by_category(self, category: str, limit: int = 20) -> List[Product]:
        stmt = select(Product).where(Product.category == category, Product.in_stock == True).order_by(Product.rating.desc()).limit(limit)
        res = await self.db.execute(stmt)
        return list(res.scalars().all())

    async def get_by_category_or_dept(self, category_query: str, limit: int = 40) -> List[Product]:
        if not category_query or category_query == "all":
            stmt = select(Product).where(Product.in_stock == True).order_by(Product.rating.desc()).limit(limit)
        else:
            q_lower = f"%{category_query.lower()}%"
            stmt = select(Product).where(
                (func.lower(Product.category).like(q_lower)) |
                (func.lower(Product.sub_category).like(q_lower)) |
                (func.lower(Product.title).like(q_lower))
            ).where(Product.in_stock == True).order_by(Product.rating.desc()).limit(limit)
        res = await self.db.execute(stmt)
        return list(res.scalars().all())

    async def get_popular_products(self, limit: int = 10) -> List[Product]:
        cache_key = f"cache:popular:{limit}"
        cached = await redis_manager.get_json(cache_key)
        if cached:
            return [Product(**p) for p in cached]

        stmt = select(Product).where(Product.in_stock == True).order_by(Product.view_count.desc(), Product.rating.desc()).limit(limit)
        res = await self.db.execute(stmt)
        prods = list(res.scalars().all())
        
        prod_dicts = [
            {
                "id": p.id,
                "title": p.title,
                "description": p.description,
                "category_id": p.category_id,
                "brand_id": p.brand_id,
                "category": p.category,
                "brand": p.brand,
                "sub_category": p.sub_category,
                "price": p.price,
                "original_price": p.original_price,
                "rating": p.rating,
                "review_count": p.review_count,
                "image_url": p.image_url,
                "attributes": p.attributes,
                "in_stock": p.in_stock
            }
            for p in prods
        ]
        await redis_manager.set_json(cache_key, prod_dicts, ttl=1800)
        return prods

    async def count(self) -> int:
        stmt = select(func.count(Product.id))
        res = await self.db.execute(stmt)
        return res.scalar() or 0

    async def save_product(self, product_data: Dict[str, Any]) -> Product:
        prod = Product(**product_data)
        self.db.add(prod)
        await self.db.commit()
        await self.db.refresh(prod)
        return prod

    async def vector_search(self, query_vector: List[float], limit: int = 50) -> List[Tuple[Product, float]]:
        """
        PostgreSQL embedding similarity search fallback when FAISS is unavailable.
        Computes cosine similarity between query_vector and ProductEmbedding rows.
        """
        try:
            import numpy as np
            stmt = select(Product, ProductEmbedding).join(ProductEmbedding, Product.id == ProductEmbedding.product_id).where(Product.in_stock == True).limit(200)
            res = await self.db.execute(stmt)
            rows = res.all()
            if not rows:
                return []
            
            q_arr = np.array(query_vector, dtype=np.float32)
            q_norm = np.linalg.norm(q_arr)
            if q_norm > 0:
                q_arr = q_arr / q_norm

            scored_prods = []
            for prod, emb in rows:
                if emb and emb.vector_json:
                    v_arr = np.array(emb.vector_json, dtype=np.float32)
                    v_norm = np.linalg.norm(v_arr)
                    if v_norm > 0:
                        v_arr = v_arr / v_norm
                    sim = float(np.dot(q_arr, v_arr))
                    scored_prods.append((prod, sim))

            scored_prods.sort(key=lambda x: x[1], reverse=True)
            return scored_prods[:limit]
        except Exception as e:
            logger.warning(f"PostgreSQL vector search fallback error: {e}")
            return []

