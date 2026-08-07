import os
import json
import asyncio
import logging
from sqlalchemy.future import select
from app.core.database import AsyncSessionLocal, init_db
from app.models.domain import Product, Category, Brand, ProductEmbedding
from app.core.embeddings import embedding_service
from app.core.faiss_manager import faiss_manager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("intent_iq.seed")

async def seed_data():
    await init_db()
    
    # Check catalog files
    seed_file = "catalog_100.json" if os.path.exists(os.path.join(os.path.dirname(__file__), "catalog_100.json")) else "catalog.json"
    catalog_path = os.path.join(os.path.dirname(__file__), seed_file)
    
    if not os.path.exists(catalog_path):
        logger.error(f"Catalog file {catalog_path} not found.")
        return

    with open(catalog_path, "r", encoding="utf-8") as f:
        products_data = json.load(f)

    async with AsyncSessionLocal() as db:
        # Seed Categories & Brands
        categories_set = {p["category"] for p in products_data}
        brands_set = {p["brand"] for p in products_data if "brand" in p}

        for cat_name in categories_set:
            cat_id = f"cat_{cat_name.lower().replace(' ', '_').replace('&', 'and')}"
            stmt = select(Category).where(Category.id == cat_id)
            res = await db.execute(stmt)
            if not res.scalar_one_or_none():
                db.add(Category(id=cat_id, name=cat_name, description=f"Catalog category {cat_name}"))

        for brand_name in brands_set:
            clean_brand = brand_name.lower().replace(' ', '_').replace("'", "")
            brand_id = f"brand_{clean_brand}"
            stmt = select(Brand).where(Brand.id == brand_id)
            res = await db.execute(stmt)
            if not res.scalar_one_or_none():
                db.add(Brand(id=brand_id, name=brand_name))

        await db.commit()

        # Seed Products
        added_products = []
        for p in products_data:
            stmt = select(Product).where(Product.id == p["id"])
            res = await db.execute(stmt)
            existing = res.scalar_one_or_none()
            
            cat_name = p["category"]
            cat_id = f"cat_{cat_name.lower().replace(' ', '_').replace('&', 'and')}"
            brand_name = p.get("brand", "Generic")
            clean_brand = brand_name.lower().replace(' ', '_').replace("'", "")
            brand_id = f"brand_{clean_brand}"

            p_dict = {
                "id": p["id"],
                "title": p["title"],
                "description": p.get("description", ""),
                "category_id": cat_id,
                "brand_id": brand_id,
                "category": cat_name,
                "brand": brand_name,
                "sub_category": p.get("sub_category", "General"),
                "price": float(p["price"]),
                "original_price": float(p["original_price"]) if p.get("original_price") else None,
                "rating": float(p.get("rating", 4.5)),
                "review_count": int(p.get("review_count", 100)),
                "image_url": p["image_url"],
                "attributes": p.get("attributes", {}),
                "in_stock": p.get("in_stock", True)
            }

            if not existing:
                prod = Product(**p_dict)
                db.add(prod)
            added_products.append(p_dict)

        await db.commit()
        logger.info(f"Database successfully populated with {len(added_products)} products across categories.")

        # Module 3: SentenceTransformers Embedding Pipeline
        texts_to_embed = [
            f"{p['title']} Brand: {p['brand']} Category: {p['category']} {p.get('description', '')}"
            for p in added_products
        ]
        
        logger.info(f"Computing embeddings for {len(texts_to_embed)} items using SentenceTransformers...")
        embeddings = embedding_service.encode_batch(texts_to_embed)

        # Store ProductEmbeddings in DB
        for p_dict, emb_vec in zip(added_products, embeddings):
            stmt = select(ProductEmbedding).where(ProductEmbedding.product_id == p_dict["id"])
            res = await db.execute(stmt)
            if not res.scalar_one_or_none():
                db.add(ProductEmbedding(
                    product_id=p_dict["id"],
                    vector_json=emb_vec,
                    dimension=len(emb_vec)
                ))
        await db.commit()

        # Module 4: FAISS Batch Insert & Disk Persistence
        faiss_manager.reset()
        faiss_manager.add_products(added_products, embeddings)
        
        # Save FAISS Index to disk
        index_disk_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "faiss_index.bin")
        faiss_manager.save_to_disk(index_disk_path)
        logger.info(f"FAISS index saved to disk at: {index_disk_path}")

if __name__ == "__main__":
    embedding_service.load_model()
    asyncio.run(seed_data())
