import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.core.database import init_db, AsyncSessionLocal
from app.core.embeddings import embedding_service
from app.core.faiss_manager import faiss_manager
from app.agents.search_agent import search_agent
from app.repositories.product_repository import ProductRepository

async def test_queries():
    await init_db()
    embedding_service.load_model()
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    faiss_manager.load_from_disk(os.path.join(base_dir, "data", "indexes", "products.faiss"))

    queries = [
        "organic milk",
        "headphones",
        "coffee",
        "banana",
        "jeans",
        "snack",
        "high protein breakfast"
    ]

    async with AsyncSessionLocal() as db:
        repo = ProductRepository(db)
        for q in queries:
            results, meta, elapsed, mode = await search_agent.search(q, repo, top_k=5)
            print(f"\n=== QUERY: '{q}' (Mode: {mode}, {elapsed:.1f}ms) ===")
            for idx, r in enumerate(results, 1):
                p = r["product"]
                score = r["score"]
                print(f"{idx}. [{p.id}] {p.title} ({p.category}) - Score: {score:.4f}")

if __name__ == "__main__":
    asyncio.run(test_queries())
