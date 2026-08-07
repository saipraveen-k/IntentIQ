import time
import logging
from typing import Dict, Any, List, Tuple
from app.core.embeddings import embedding_service
from app.core.faiss_manager import faiss_manager
from app.core.gemini_client import gemini_client
from app.repositories.product_repository import ProductRepository
from app.core.redis_client import redis_manager

logger = logging.getLogger("intent_iq.search_agent")

class SemanticSearchAgent:
    """
    Module 7: Semantic Search Agent
    Performance-optimized natural language search agent with precomputed embedding vector lookup and query caching.
    """
    async def search(
        self,
        query: str,
        product_repo: ProductRepository,
        top_k: int = 12
    ) -> Tuple[List[Dict[str, Any]], Dict[str, Any], float]:
        start_time = time.time()
        
        # Check Cache for exact search query
        cache_key = f"cache:search:{hash(query)}:{top_k}"
        cached = await redis_manager.get_json(cache_key)
        if cached:
            product_ids = [item["id"] for item in cached["results"]]
            scores_map = {item["id"]: item["score"] for item in cached["results"]}
            products = await product_repo.get_by_ids(product_ids)
            
            results = [{"product": p, "score": scores_map.get(p.id, 0.9)} for p in products]
            elapsed = round((time.time() - start_time) * 1000.0, 2)
            return results, cached["meta"], elapsed

        # Step 1: Gemini / Fast Intent & Budget Extraction
        intent_metadata = await gemini_client.extract_search_intents(query)
        budget_max = intent_metadata.get("budget_max")
        extracted_intents = intent_metadata.get("extracted_intents", [query])

        # Step 2: Dense Embedding Vector Lookup
        query_vec = embedding_service.encode(query)

        # Step 3: Fast FAISS Top-K Vector Search
        candidates = faiss_manager.top_k_search(query_vec, top_k=top_k * 2)
        candidate_ids = [sku for sku, _ in candidates]
        scores_map = {sku: score for sku, score in candidates}

        # Step 4: Batch Product Retrieval via Repository
        if candidate_ids:
            products = await product_repo.get_by_ids(candidate_ids)
        else:
            products = await product_repo.get_all(limit=top_k)

        results = []
        cache_items = []
        for prod in products:
            if budget_max and prod.price > budget_max:
                continue
            
            similarity = scores_map.get(prod.id, 0.75)
            results.append({
                "product": prod,
                "score": round(float(similarity), 3)
            })
            cache_items.append({"id": prod.id, "score": round(float(similarity), 3)})

            if len(results) >= top_k:
                break

        # Store in Cache
        await redis_manager.set_json(cache_key, {
            "results": cache_items,
            "meta": intent_metadata
        }, ttl=1800)

        latency_ms = round((time.time() - start_time) * 1000.0, 2)
        return results, intent_metadata, latency_ms

search_agent = SemanticSearchAgent()
