import os
import logging
from typing import List, Dict, Any
from sqlalchemy.future import select
from app.core.database import AsyncSessionLocal
from app.models.domain import ProductEmbedding
from app.core.embeddings import embedding_service
from app.core.faiss_manager import faiss_manager

logger = logging.getLogger("intent_iq.embedding_pipeline")

class PipelineEmbeddingEngine:
    """
    Task 3: Embedding Pipeline
    Computes dense vector representations for Instacart items using format: `Product Name Department Aisle`.
    Model: sentence-transformers/all-MiniLM-L6-v2 (384-dimensional).
    Stores vectors in database and updates/saves FAISS index to disk.
    """
    async def process_and_index(self, products: List[Dict[str, Any]], rebuild_faiss: bool = True):
        if not products:
            logger.warning("No products provided for embedding pipeline.")
            return

        # Format: Product Name Department Aisle
        texts_to_embed = [
            f"{p['title']} {p['category']} {p.get('sub_category', '')} {p.get('description', '')}"
            for p in products
        ]

        logger.info(f"Generating dense vector embeddings for {len(texts_to_embed)} Instacart products using sentence-transformers/all-MiniLM-L6-v2...")
        embeddings = embedding_service.encode_batch(texts_to_embed)

        async with AsyncSessionLocal() as db:
            for p_dict, emb_vec in zip(products, embeddings):
                stmt = select(ProductEmbedding).where(ProductEmbedding.product_id == p_dict["id"])
                res = await db.execute(stmt)
                existing = res.scalar_one_or_none()

                if not existing:
                    db.add(ProductEmbedding(
                        product_id=p_dict["id"],
                        vector_json=emb_vec,
                        dimension=len(emb_vec),
                        model_version="sentence-transformers/all-MiniLM-L6-v2"
                    ))
            await db.commit()
            logger.info("Persisted product embeddings into database.")

        if rebuild_faiss:
            logger.info("Updating FAISS vector index...")
            faiss_manager.add_products(products, embeddings)
            
            # Save FAISS index binary to disk
            disk_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "faiss_index.bin")
            faiss_manager.save_to_disk(disk_path)
            logger.info(f"FAISS index saved to disk at {disk_path}")
