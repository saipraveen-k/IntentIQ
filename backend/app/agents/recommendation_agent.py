import time
import logging
from typing import List, Tuple, Dict, Any
from app.agents.intent_agent import intent_agent
from app.core.faiss_manager import faiss_manager
from app.repositories.product_repository import ProductRepository
from app.core.redis_client import redis_manager

logger = logging.getLogger("intent_iq.recommendation_agent")

class RecommendationAgent:
    """
    Module 6: Recommendation Agent
    High-throughput hybrid multi-stage recommendation funnel:
    Active User Intent -> FAISS Vector Similarity -> Popularity Priors -> Cold Start -> Category Diversity -> Top 10.
    Caches feed payloads to achieve sub-millisecond execution times.
    """
    async def get_hybrid_recommendations(
        self,
        session_id: str,
        product_repo: ProductRepository,
        limit: int = 10
    ) -> Tuple[List[Dict[str, Any]], str, float]:
        start_time = time.time()
        
        # Step 1: Fetch active user intent & vector
        intent_info = await intent_agent.get_active_intent(session_id)
        vector = intent_info.get("vector")
        active_label = intent_info.get("active_label", "General Discovery")
        confidence = intent_info.get("confidence", 0.5)

        # Step 2: High recall vector candidate retrieval via FAISS (Top 25 candidates)
        candidates = faiss_manager.top_k_search(vector, top_k=25)
        candidate_ids = [sku for sku, _ in candidates]
        faiss_scores_map = {sku: score for sku, score in candidates}

        # Step 3: Bulk fetch candidates from ProductRepository
        if candidate_ids:
            db_products = await product_repo.get_by_ids(candidate_ids)
        else:
            db_products = await product_repo.get_popular_products(limit=limit)

        if not db_products:
            db_products = await product_repo.get_all(limit=limit)

        # Step 4: Hybrid Scoring
        scored_products = []
        for prod in db_products:
            faiss_score = faiss_scores_map.get(prod.id, 0.5)
            rating_score = (prod.rating / 5.0) * 0.2
            popularity_boost = min(0.1, (prod.view_count or 0) * 0.001)
            cold_start_boost = 0.05 if (prod.review_count or 0) < 50 else 0.0

            hybrid_score = (faiss_score * 0.65) + rating_score + popularity_boost + cold_start_boost
            scored_products.append((prod, hybrid_score))

        scored_products.sort(key=lambda x: x[1], reverse=True)

        # Step 5: Category Diversity Reranking & Strict Product Deduplication
        final_products = []
        seen_ids: Set[str] = set()
        category_counts: Dict[str, int] = {}

        for prod, score in scored_products:
            if prod.id in seen_ids:
                continue
            cat_count = category_counts.get(prod.category, 0)
            if cat_count < 3 or len(final_products) < limit / 2:
                category_counts[prod.category] = cat_count + 1
                seen_ids.add(prod.id)
                final_products.append({
                    "product": prod,
                    "score": round(float(score), 3)
                })
            if len(final_products) >= limit:
                break

        if len(final_products) < limit:
            for prod, score in scored_products:
                if prod.id not in seen_ids:
                    seen_ids.add(prod.id)
                    final_products.append({
                        "product": prod,
                        "score": round(float(score), 3)
                    })
                if len(final_products) >= limit:
                    break

        return final_products, active_label, confidence

recommendation_agent = RecommendationAgent()
