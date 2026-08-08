import time
import logging
from typing import Dict, Any, List, Tuple
from app.core.embeddings import embedding_service
from app.core.faiss_manager import faiss_manager
from app.core.cross_encoder import cross_encoder_service
from app.core.gemini_client import gemini_client
from app.repositories.product_repository import ProductRepository
from app.core.redis_client import redis_manager

logger = logging.getLogger("intent_iq.search_agent")

class SemanticSearchAgent:
    """
    Semantic Search Intelligence Agent:
    Query -> Sub-Intents Extraction -> Dense Embedding (384d) -> FAISS Retrieval -> Cross-Encoder / Ranking -> Results.
    Provides complete fallback cascade:
    FAISS -> SQL_FALLBACK -> POPULARITY_FALLBACK, exposing retrieval_mode.
    """
    async def search(
        self,
        query: str,
        product_repo: ProductRepository,
        top_k: int = 12
    ) -> Tuple[List[Dict[str, Any]], Dict[str, Any], float, str]:
        start_time = time.time()
        retrieval_mode = "FAISS"
        
        # Check in-memory / Redis Cache
        cache_key = f"cache:search:{hash(query)}:{top_k}"
        cached = await redis_manager.get_json(cache_key)
        if cached:
            product_ids = [item["id"] for item in cached["results"]]
            scores_map = {item["id"]: item["score"] for item in cached["results"]}
            products = await product_repo.get_by_ids(product_ids)
            
            results = [{"product": p, "score": scores_map.get(str(p.id), 0.9)} for p in products]
            elapsed = round((time.time() - start_time) * 1000.0, 2)
            return results, cached["meta"], elapsed, "CACHE_HIT"

        # Step 1: Sub-Intents & Budget Extraction (via Gemini or Regex Fallback)
        intent_metadata = await gemini_client.extract_search_intents(query)
        budget_max = intent_metadata.get("budget_max")
        extracted_intents = intent_metadata.get("extracted_intents", [query])

        # Step 2: Dense Embedding (384-dimensional)
        query_vec = embedding_service.encode(query)

        # Step 3: Candidate Retrieval Cascade
        candidate_ids = []
        scores_map = {}

        if faiss_manager.is_initialized and len(faiss_manager.id_map) > 0:
            candidates = faiss_manager.top_k_search(query_vec, top_k=top_k * 3)
            candidate_ids = [str(sku) for sku, _ in candidates]
            scores_map = {str(sku): float(score) for sku, score in candidates}
            retrieval_mode = "FAISS"

        # SQL Fallback if FAISS produced no candidates
        if not candidate_ids:
            logger.warning("FAISS search yielded no candidates. Falling back to SQL vector/category search...")
            sql_products = await product_repo.get_by_category_or_dept(query, limit=top_k * 2)
            candidate_ids = [str(p.id) for p in sql_products]
            scores_map = {str(p.id): 0.75 for p in sql_products}
            retrieval_mode = "SQL_FALLBACK"

        # Popularity Fallback if SQL search also yields nothing
        if not candidate_ids:
            logger.warning("SQL search yielded no candidates. Falling back to Catalog Popularity...")
            pop_products = await product_repo.get_popular_products(limit=top_k)
            candidate_ids = [str(p.id) for p in pop_products]
            scores_map = {str(p.id): 0.60 for p in pop_products}
            retrieval_mode = "POPULARITY_FALLBACK"

        # Step 4: Batch Product Retrieval
        products = await product_repo.get_by_ids(candidate_ids) if candidate_ids else []

        # If FAISS product IDs did not match DB products, fall back to SQL search
        if not products:
            logger.warning("FAISS candidate IDs did not match catalog products. Falling back to SQL search...")
            sql_products = await product_repo.get_by_category_or_dept(query, limit=top_k * 2)
            if sql_products:
                products = sql_products
                scores_map = {str(p.id): 0.75 for p in sql_products}
                retrieval_mode = "SQL_FALLBACK"
            else:
                pop_products = await product_repo.get_popular_products(limit=top_k)
                products = pop_products
                scores_map = {str(p.id): 0.60 for p in pop_products}
                retrieval_mode = "POPULARITY_FALLBACK"

        # Step 5: Filter & Rerank Candidates
        filtered_products = []
        seen_ids = set()

        for prod in products:
            p_id = str(prod.id)
            if p_id in seen_ids:
                continue
            if budget_max and prod.price > budget_max:
                continue

            seen_ids.add(p_id)
            similarity = scores_map.get(p_id, 0.70)
            filtered_products.append({
                "product": prod,
                "score": round(float(similarity), 3)
            })

        # Final safety fallback if all products were filtered out by budget
        if not filtered_products and products:
            for prod in products[:top_k]:
                filtered_products.append({
                    "product": prod,
                    "score": 0.50
                })

        # Step 6: CrossEncoder Rerank on top candidate subset (max 20)
        if len(filtered_products) > 1 and cross_encoder_service.is_loaded:
            candidate_texts = [f"{item['product'].title} {item['product'].category}" for item in filtered_products[:20]]
            rerank_indices = cross_encoder_service.rerank(query, candidate_texts, top_k=top_k)
            final_results = []
            for rank_idx, score in rerank_indices:
                if rank_idx < len(filtered_products):
                    item = filtered_products[rank_idx]
                    item["score"] = round(float(score), 3)
                    final_results.append(item)
        else:
            final_results = filtered_products[:top_k]


        # Store in Cache if results were retrieved
        if final_results:
            cache_items = [{"id": str(item["product"].id), "score": item["score"]} for item in final_results]
            await redis_manager.set_json(cache_key, {
                "results": cache_items,
                "meta": intent_metadata,
                "retrieval_mode": retrieval_mode
            }, ttl=1800)

        latency_ms = round((time.time() - start_time) * 1000.0, 2)
        logger.info(f"Semantic Search for '{query}' executed in {latency_ms}ms via [{retrieval_mode}] ({len(final_results)} results).")

        return final_results, intent_metadata, latency_ms, retrieval_mode

search_agent = SemanticSearchAgent()
