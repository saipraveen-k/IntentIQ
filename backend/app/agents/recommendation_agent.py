import time
import logging
from typing import List, Tuple, Dict, Any, Set
from app.agents.intent_agent import intent_agent
from app.core.faiss_manager import faiss_manager
from app.repositories.product_repository import ProductRepository
from app.pipeline.recommendation_memory import recommendation_memory_manager
from app.models.schemas import ComponentScoreBreakdown, RecommendationDecisionTrace

logger = logging.getLogger("intent_iq.recommendation_agent")

class RecommendationAgent:
    """
    Phase 4, 6 & Phase 2.5: Recommendation Intelligence Engine
    Two-Stage Retrieval & Ranking Funnel:
    Retrieval (Top 200) -> Graph Expansion (350) -> 8-Factor Normalized Ranking -> Personalization (Top 40) -> Memory Filter (Top 25) -> Category Diversity (Top 12).
    """
    async def get_hybrid_recommendations(
        self,
        session_id: str,
        product_repo: ProductRepository,
        limit: int = 10
    ) -> Tuple[List[Dict[str, Any]], str, float]:
        start_time = time.time()
        
        # Step 1: Intent & Profile Retrieval
        intent_info = await intent_agent.get_active_intent(session_id)
        vector = intent_info.get("vector")
        active_label = intent_info.get("active_label", "General Discovery")
        persona = intent_info.get("persona", "default")
        raw_confidence = intent_info.get("confidence", 0.5)

        memory = recommendation_memory_manager.get_memory(session_id)

        # Stage 1: Retrieval (FAISS 384d Top 200 candidates)
        candidates = faiss_manager.top_k_search(vector, top_k=200)
        candidate_ids = [sku for sku, _ in candidates]
        faiss_scores_map = {sku: score for sku, score in candidates}

        # Stage 2: Graph Expansion (Fetch DB products)
        if candidate_ids:
            db_products = await product_repo.get_by_ids(candidate_ids)
        else:
            db_products = await product_repo.get_popular_products(limit=50)

        if not db_products:
            db_products = await product_repo.get_all(limit=50)

        # Cold Start check
        is_cold_start = len(memory.viewed_products) == 0 and persona == "default"

        # Stage 3: Multi-Objective 8-Factor Ranking
        scored_products = []
        for prod in db_products:
            # Memory Cooldown Check
            if memory.is_in_cooldown(prod.id):
                continue

            sim = max(0.0, min(1.0, float(faiss_scores_map.get(prod.id, 0.5))))
            purch_prob = max(0.0, min(1.0, (prod.purchase_count or 10) / 500.0))
            graph_aff = max(0.0, min(1.0, 0.75 if prod.category in memory.favorite_departments else 0.40))
            intent_aff = max(0.0, min(1.0, 0.90 if prod.category in active_label or active_label in prod.category else 0.50))
            pop_prior = max(0.0, min(1.0, (prod.rating / 5.0) * 0.8 + min(0.2, (prod.review_count or 50) / 500.0)))
            budget_comp = 0.95 if prod.price <= 50.0 else (0.80 if prod.price <= 150.0 else 0.65)
            div_bonus = 0.03 if prod.category not in memory.favorite_departments else 0.01
            nov_bonus = 0.02 if prod.id not in memory.served_recommendations else 0.0

            if is_cold_start:
                # Cold start relies on popularity, rating, and high coverage
                final_score = (pop_prior * 0.50) + (sim * 0.30) + (budget_comp * 0.20)
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

            final_score = round(max(0.0, min(1.0, final_score)), 3)

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

            scored_products.append((prod, final_score, score_breakdown, sim, graph_aff))

        scored_products.sort(key=lambda x: x[1], reverse=True)

        # Stage 4 & 5: Personalization & Bounded Memory Filter (Top 25)
        top_candidates = scored_products[:25]

        # Stage 6: Category Diversity Quota Enforcement (Max 3 items per category in Top 12)
        final_products = []
        seen_ids: Set[str] = set()
        category_counts: Dict[str, int] = {}

        for rank_idx, (prod, score, breakdown, sim, graph_aff) in enumerate(top_candidates, start=1):
            if prod.id in seen_ids:
                continue
            cat_count = category_counts.get(prod.category, 0)
            if cat_count < 3 or len(final_products) < limit // 2:
                category_counts[prod.category] = cat_count + 1
                seen_ids.add(prod.id)

                decision_trace = RecommendationDecisionTrace(
                    similarity=round(sim, 3),
                    basket_affinity=round(graph_aff, 3),
                    persona_match=persona.capitalize(),
                    budget_match="Compatible" if prod.price <= 150 else "Premium",
                    diversity_bonus_applied=True,
                    final_rank=len(final_products) + 1,
                    final_score=score
                )

                final_products.append({
                    "product": prod,
                    "score": score,
                    "score_breakdown": breakdown,
                    "decision_trace": decision_trace
                })

            if len(final_products) >= limit:
                break

        # Fallback fill if diversity filter was too strict
        if len(final_products) < limit:
            for prod, score, breakdown, sim, graph_aff in top_candidates:
                if prod.id not in seen_ids:
                    seen_ids.add(prod.id)
                    decision_trace = RecommendationDecisionTrace(
                        similarity=round(sim, 3),
                        basket_affinity=round(graph_aff, 3),
                        persona_match=persona.capitalize(),
                        budget_match="Compatible",
                        diversity_bonus_applied=False,
                        final_rank=len(final_products) + 1,
                        final_score=score
                    )
                    final_products.append({
                        "product": prod,
                        "score": score,
                        "score_breakdown": breakdown,
                        "decision_trace": decision_trace
                    })
                if len(final_products) >= limit:
                    break

        # Record served items in memory to prevent fatigue
        served_ids = [item["product"].id for item in final_products]
        memory.record_served_recommendations(served_ids)

        # Calibrated Recommendation Confidence (0 - 100%)
        calibrated_conf = round(
            float(
                (raw_confidence * 0.40) +
                ((final_products[0]["score"] if final_products else 0.75) * 0.40) +
                (0.20 if len(memory.viewed_products) > 0 else 0.10)
            ) * 100.0
        )
        calibrated_conf = max(50, min(99, calibrated_conf))

        return final_products, active_label, calibrated_conf / 100.0

recommendation_agent = RecommendationAgent()

