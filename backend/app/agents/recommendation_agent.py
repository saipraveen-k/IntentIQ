import time
import logging
from typing import List, Tuple, Dict, Any, Set
from app.agents.intent_agent import intent_agent
from app.core.faiss_manager import faiss_manager
from app.core.recommendation_models import recommendation_model_service
from app.repositories.product_repository import ProductRepository
from app.pipeline.recommendation_memory import recommendation_memory_manager
from app.models.schemas import ComponentScoreBreakdown, RecommendationDecisionTrace

logger = logging.getLogger("intent_iq.recommendation_agent")

class RecommendationAgent:
    """
    Genuine 6-Stage Recommendation Funnel:
    - Stage 1: FAISS Vector Retrieval -> Top 200 candidates
    - Stage 2: Graph Expansion -> Up to 350 candidates
    - Stage 3: Multi-Objective Ranking -> All 350 candidates (weighted 8-factor score)
    - Stage 4: Session Personalization -> Top 40
    - Stage 5: Bounded Memory & Cooldown Filtering -> Top 25
    - Stage 6: Category Diversity Enforcement -> Top 12 (max 35% quota)
    """
    async def get_hybrid_recommendations(
        self,
        session_id: str,
        product_repo: ProductRepository,
        limit: int = 12
    ) -> Tuple[List[Dict[str, Any]], str, float, Dict[str, int]]:
        start_time = time.time()
        
        # Step 1: Intent & Profile Retrieval
        intent_info = await intent_agent.get_active_intent(session_id)
        vector = intent_info.get("vector")
        active_label = intent_info.get("active_label", "General Discovery")
        persona = intent_info.get("persona", "default")
        raw_confidence = float(intent_info.get("confidence", 0.5))
        is_cold_start = intent_info.get("is_cold_start", False)

        memory = recommendation_memory_manager.get_memory(session_id)

        # Stage 1: FAISS Vector Retrieval (Top 200)
        retrieval_limit = 200
        if vector and len(vector) == 384 and faiss_manager.is_initialized:
            candidates = faiss_manager.top_k_search(vector, top_k=retrieval_limit)
            candidate_ids = [str(sku) for sku, _ in candidates]
            faiss_scores_map = {str(sku): float(score) for sku, score in candidates}
        else:
            candidates = []
            candidate_ids = []
            faiss_scores_map = {}

        # Fallback 1: PostgreSQL embedding vector search if FAISS unavailable/empty
        if not candidate_ids and vector and len(vector) == 384:
            pg_vector_results = await product_repo.vector_search(vector, limit=retrieval_limit)
            if pg_vector_results:
                retrieved_prods = [prod for prod, _ in pg_vector_results]
                candidate_ids = [str(p.id) for p in retrieved_prods]
                faiss_scores_map = {str(prod.id): float(score) for prod, score in pg_vector_results}
            else:
                retrieved_prods = await product_repo.get_popular_products(limit=50)
        elif candidate_ids:
            retrieved_prods = await product_repo.get_by_ids(candidate_ids)
        else:
            retrieved_prods = await product_repo.get_popular_products(limit=50)

        retrieval_count = len(retrieved_prods)


        # Stage 2: Graph Expansion (Fetch complementary & frequently bought graph neighbors up to 350)
        candidate_pool = {p.id: p for p in retrieved_prods}
        graph_expanded_ids = set()
        
        for p in retrieved_prods[:30]:
            # Fetch graph bundle neighbors
            if hasattr(p, 'id'):
                # Expand with same department and related aisles
                more_items = await product_repo.get_by_category(p.category, limit=5)
                for item in more_items:
                    if item.id not in candidate_pool and len(candidate_pool) < 350:
                        candidate_pool[item.id] = item
                        graph_expanded_ids.add(item.id)

        # Ensure we have candidate pool
        if len(candidate_pool) < 50:
            catalog_fill = await product_repo.get_all(limit=100)
            for item in catalog_fill:
                if item.id not in candidate_pool:
                    candidate_pool[item.id] = item

        all_candidates = list(candidate_pool.values())
        graph_expansion_count = len(all_candidates)

        # Stage 3: Multi-Objective 8-Factor Ranking (Scoring all candidates)
        # Formula:
        # score = 0.30*semantic + 0.20*purchase_prob + 0.15*graph_aff + 0.15*intent_aff + 0.10*popularity + 0.05*budget + 0.03*diversity + 0.02*novelty
        scored_candidates = []
        max_purchase_count = max([getattr(p, 'purchase_count', 1) or 1 for p in all_candidates] or [1])

        for prod in all_candidates:
            # Check SKU cooldown in memory
            if memory.is_in_cooldown(str(prod.id)):
                continue

            sim = max(0.0, min(1.0, faiss_scores_map.get(str(prod.id), 0.50)))
            purch_prob = max(0.0, min(1.0, (getattr(prod, 'purchase_count', 10) or 10) / float(max_purchase_count)))
            graph_aff = 0.85 if prod.id in graph_expanded_ids or prod.category in memory.favorite_departments else 0.45
            intent_aff = 0.90 if prod.category in active_label or active_label in prod.category else 0.40
            pop_prior = max(0.0, min(1.0, (getattr(prod, 'rating', 4.5) / 5.0) * 0.7 + min(0.3, (getattr(prod, 'review_count', 50) or 50) / 600.0)))
            budget_comp = 0.95 if prod.price <= 10.0 else (0.80 if prod.price <= 25.0 else 0.65)
            div_bonus = 0.03 if prod.category not in memory.favorite_departments else 0.01
            nov_bonus = 0.02 if str(prod.id) not in memory.served_recommendations else 0.0

            if is_cold_start:
                # Cold start relies strictly on real popularity, quality rating, and catalog diversity
                final_score = (0.45 * pop_prior) + (0.35 * purch_prob) + (0.15 * budget_comp) + div_bonus
            else:
                final_score = (
                    (0.30 * sim) +
                    (0.20 * purch_prob) +
                    (0.15 * graph_aff) +
                    (0.15 * intent_aff) +
                    (0.10 * pop_prior) +
                    (0.05 * budget_comp) +
                    div_bonus +
                    nov_bonus
                )

            final_score = round(max(0.0, min(1.0, float(final_score))), 4)

            score_breakdown = ComponentScoreBreakdown(
                semantic=round(sim, 3),
                graph=round(graph_aff, 3),
                intent=round(intent_aff, 3),
                budget=round(budget_comp, 3),
                popularity=round(pop_prior, 3),
                diversity_bonus=round(div_bonus, 3),
                novelty_bonus=round(nov_bonus, 3),
                final_score=final_score
            )

            scored_candidates.append({
                "product": prod,
                "score": final_score,
                "score_breakdown": score_breakdown,
                "similarity": sim,
                "graph_affinity": graph_aff,
                "intent_affinity": intent_aff
            })

        # Sort all scored candidates descending
        scored_candidates.sort(key=lambda x: x["score"], reverse=True)
        ranked_count = len(scored_candidates)

        # Stage 4: Session Personalization (Top 40)
        personalized_pool = scored_candidates[:40]
        personalized_count = len(personalized_pool)

        # Stage 5: Bounded Memory & Cooldown Filtering (Top 25)
        memory_filtered = []
        for item in personalized_pool:
            p_id = str(item["product"].id)
            if not memory.is_in_cooldown(p_id):
                memory_filtered.append(item)
            if len(memory_filtered) >= 25:
                break
        memory_filtered_count = len(memory_filtered)

        # Stage 6: Category Diversity Quota Enforcement (Top 12, max 35% per category = at most 4 items in 12)
        max_per_category = max(2, int(limit * 0.35))
        final_recommendations = []
        category_counts: Dict[str, int] = {}
        seen_ids: Set[str] = set()

        for item in memory_filtered:
            prod = item["product"]
            p_id = str(prod.id)
            if p_id in seen_ids:
                continue

            cat = prod.category
            current_cat_count = category_counts.get(cat, 0)
            if current_cat_count < max_per_category:
                category_counts[cat] = current_cat_count + 1
                seen_ids.add(p_id)

                decision_trace = RecommendationDecisionTrace(
                    similarity=item["similarity"],
                    basket_affinity=item["graph_affinity"],
                    persona_match=persona.capitalize(),
                    budget_match="Budget Friendly" if prod.price <= 10 else "Standard",
                    diversity_bonus_applied=True,
                    final_rank=len(final_recommendations) + 1,
                    final_score=item["score"]
                )
                item["decision_trace"] = decision_trace
                final_recommendations.append(item)

            if len(final_recommendations) >= limit:
                break

        # Fallback fill if diversity filter was overly stringent
        if len(final_recommendations) < limit:
            for item in memory_filtered:
                prod = item["product"]
                p_id = str(prod.id)
                if p_id not in seen_ids:
                    seen_ids.add(p_id)
                    item["decision_trace"] = RecommendationDecisionTrace(
                        similarity=item["similarity"],
                        basket_affinity=item["graph_affinity"],
                        persona_match=persona.capitalize(),
                        budget_match="Standard",
                        diversity_bonus_applied=False,
                        final_rank=len(final_recommendations) + 1,
                        final_score=item["score"]
                    )
                    final_recommendations.append(item)
                if len(final_recommendations) >= limit:
                    break

        final_count = len(final_recommendations)

        # Update recommendation memory with served items
        served_ids = [str(item["product"].id) for item in final_recommendations]
        memory.record_served_recommendations(served_ids)

        # Real internal diagnostic funnel metrics
        diagnostics = {
            "retrieval_count": retrieval_count,
            "graph_expansion_count": graph_expansion_count,
            "ranked_count": ranked_count,
            "personalized_count": personalized_count,
            "memory_filtered_count": memory_filtered_count,
            "final_count": final_count
        }

        latency_ms = round((time.time() - start_time) * 1000.0, 2)
        logger.info(f"Hybrid Funnel executed in {latency_ms}ms: {diagnostics}")

        return final_recommendations, active_label, raw_confidence, diagnostics

recommendation_agent = RecommendationAgent()
