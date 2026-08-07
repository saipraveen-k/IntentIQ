import os
import json
import asyncio
import logging
from sqlalchemy.future import select
from app.core.database import AsyncSessionLocal, init_db
from app.models.domain import Product
from app.core.embeddings import embedding_service
from app.core.faiss_manager import faiss_manager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("intent_iq.seed")

async def seed_data():
    await init_db()
    
    catalog_path = os.path.join(os.path.dirname(__file__), "catalog.json")
    if not os.path.exists(catalog_path):
        logger.error("catalog.json not found.")
        return

    with open(catalog_path, "r", encoding="utf-8") as f:
        products_data = json.load(f)

    async with AsyncSessionLocal() as db:
        # Check existing count
        stmt = select(Product)
        res = await db.execute(stmt)
        existing = res.scalars().all()
        existing_ids = {p.id for p in existing}

        added_products = []
        for p in products_data:
            if p["id"] not in existing_ids:
                prod = Product(**p)
                db.add(prod)
                added_products.append(p)
            else:
                added_products.append(p)

        await db.commit()
        logger.info(f"Database seeded with {len(added_products)} products.")

        # Build FAISS Index
        texts = [f"{p['title']} {p['category']} {p.get('description', '')}" for p in added_products]
        logger.info(f"Generating vectors for {len(texts)} product items...")
        embeddings = embedding_service.encode_batch(texts)
        
        faiss_manager.add_products(added_products, embeddings)
        logger.info("FAISS vector index initialized successfully.")

if __name__ == "__main__":
    embedding_service.load_model()
    asyncio.run(seed_data())
