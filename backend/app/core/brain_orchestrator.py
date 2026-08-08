import time
import asyncio
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.guardrail_agent import guardrail_agent
from app.agents.intent_agent import intent_agent
from app.agents.search_agent import search_agent
from app.agents.recommendation_agent import recommendation_agent
from app.agents.bundle_agent import bundle_agent
from app.agents.explainability_agent import explainability_agent
from app.agents.analytics_agent import analytics_agent
from app.repositories.product_repository import ProductRepository
from app.repositories.session_repository import SessionRepository
from app.repositories.bundle_repository import BundleRepository
from app.repositories.analytics_repository import AnalyticsRepository

logger = logging.getLogger("intent_iq.brain_orchestrator")

class AIBrainOrchestrator:
    """
    Part 1: AI Brain Orchestrator
    Unified Agent Coordinator that executes all 7 AI agents in sequence:
    Guardrail -> Intent -> Search -> Recommendation -> Bundle -> Explainability -> Analytics.
    Measures per-agent latency and generates execution trace.
    """
    async def analyze(
        self,
        session_id: str,
        db: AsyncSession,
        search_query: Optional[str] = None,
        clicked_products: Optional[List[str]] = None,
        recent_events: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        total_start = time.time()
        agent_trace: List[Dict[str, Any]] = []
        latency_breakdown: Dict[str, float] = {}

        # Instantiate Repositories
        product_repo = ProductRepository(db)
        session_repo = SessionRepository(db)
        bundle_repo = BundleRepository(db)
        analytics_repo = AnalyticsRepository(db)

        # ---------------------------------------------------------------------
        # Step 1: Guardrail Agent Execution
        # ---------------------------------------------------------------------
        t0 = time.time()
        guardrail_result = {"is_safe": True, "flag": "CLEAN", "sanitized_text": search_query or ""}
        if search_query:
            guardrail_result = guardrail_agent.validate_and_sanitize(search_query)
            if not guardrail_result["is_safe"]:
                logger.warning(f"AI Brain Guardrail blocked query: '{search_query}'")
        
        t_guardrail = round((time.time() - t0) * 1000.0, 2)
        latency_breakdown["GuardrailAgent"] = t_guardrail
        agent_trace.append({
            "agent": "GuardrailAgent",
            "status": "BLOCKED" if not guardrail_result["is_safe"] else "SUCCESS",
            "latency_ms": t_guardrail
        })

        # ---------------------------------------------------------------------
        # Step 2: Intent Agent Execution (Process clicks & update vector)
        # ---------------------------------------------------------------------
        t0 = time.time()
        if clicked_products:
            for prod_id in clicked_products:
                prod = await product_repo.get_by_id(prod_id)
                if prod:
                    await intent_agent.update_session_intent(
                        session_id=session_id,
                        event_type="CLICK",
                        item_text=f"{prod.title} {prod.description or ''}",
                        category=prod.category,
                        session_repo=session_repo
                    )

        intent_data = await intent_agent.get_active_intent(session_id)
        t_intent = round((time.time() - t0) * 1000.0, 2)
        latency_breakdown["IntentAgent"] = t_intent
        agent_trace.append({
            "agent": "IntentAgent",
            "status": "SUCCESS",
            "latency_ms": t_intent,
            "active_intent": intent_data.get("active_label")
        })

        # ---------------------------------------------------------------------
        # Step 3: Search Agent Execution (If query is provided & safe)
        # ---------------------------------------------------------------------
        t0 = time.time()
        search_results: List[Dict[str, Any]] = []
        extracted_search_intents: List[str] = []
        
        if search_query and guardrail_result["is_safe"]:
            clean_query = guardrail_result["sanitized_text"]
            results_raw, search_meta, _, _ = await search_agent.search(
                query=clean_query,
                product_repo=product_repo,
                top_k=10
            )

            extracted_search_intents = search_meta.get("extracted_intents", [])
            for item in results_raw:
                p = item["product"]
                search_results.append({
                    "id": p.id,
                    "title": p.title,
                    "category": p.category,
                    "price": p.price,
                    "image_url": p.image_url,
                    "match_score": item["score"]
                })

        t_search = round((time.time() - t0) * 1000.0, 2)
        latency_breakdown["SearchAgent"] = t_search
        agent_trace.append({
            "agent": "SearchAgent",
            "status": "EXECUTED" if search_query else "SKIPPED",
            "latency_ms": t_search,
            "results_count": len(search_results)
        })

        # ---------------------------------------------------------------------
        # Step 4: Recommendation Agent Execution (Hybrid Top-10)
        # ---------------------------------------------------------------------
        t0 = time.time()
        recs_raw, active_label, confidence, rec_diagnostics = await recommendation_agent.get_hybrid_recommendations(
            session_id=session_id,
            product_repo=product_repo,
            limit=10
        )

        t_recs = round((time.time() - t0) * 1000.0, 2)
        latency_breakdown["RecommendationAgent"] = t_recs
        agent_trace.append({
            "agent": "RecommendationAgent",
            "status": "SUCCESS",
            "latency_ms": t_recs,
            "recommendations_count": len(recs_raw)
        })

        # ---------------------------------------------------------------------
        # Step 5: Bundle Agent Execution (Complete the Look for Top Rec)
        # ---------------------------------------------------------------------
        t0 = time.time()
        bundles: Dict[str, Any] = {}
        if recs_raw:
            top_prod = recs_raw[0]["product"]
            bundle_data = await bundle_agent.get_or_create_bundles(
                base_product=top_prod,
                product_repo=product_repo,
                bundle_repo=bundle_repo
            )
            disc_total = bundle_data.get("discounted_total")
            if disc_total is None:
                orig_total = top_prod.price + sum(p.price for p in bundle_data.get("complete_the_look", []))
                disc_total = round(orig_total * 0.85, 2)

            bundles = {
                "base_product_id": top_prod.id,
                "complete_the_look": [p.id for p in bundle_data.get("complete_the_look", [])],
                "frequently_bought_together": [p.id for p in bundle_data.get("frequently_bought_together", [])],
                "bundle_discount_pct": bundle_data.get("bundle_discount_pct", 15.0),
                "discounted_total": disc_total
            }

        t_bundle = round((time.time() - t0) * 1000.0, 2)
        latency_breakdown["BundleAgent"] = t_bundle
        agent_trace.append({
            "agent": "BundleAgent",
            "status": "SUCCESS" if bundles else "SKIPPED",
            "latency_ms": t_bundle
        })

        # ---------------------------------------------------------------------
        # Step 6: Explainability Agent Execution (XAI Rationales)
        # ---------------------------------------------------------------------
        t0 = time.time()
        async def _gen_explanation(item: Dict[str, Any]) -> Dict[str, Any]:
            p = item["product"]
            exp_text = await explainability_agent.explain(
                user_intent=active_label,
                product_title=p.title,
                category=p.category,
                brand=p.brand
            )
            return {
                "product_id": p.id,
                "product_title": p.title,
                "explanation": exp_text,
                "match_score": item["score"]
            }

        explanations: List[Dict[str, Any]] = list(
            await asyncio.gather(*[_gen_explanation(item) for item in recs_raw[:5]])
        ) if recs_raw else []

        t_xai = round((time.time() - t0) * 1000.0, 2)
        latency_breakdown["ExplainabilityAgent"] = t_xai
        agent_trace.append({
            "agent": "ExplainabilityAgent",
            "status": "SUCCESS",
            "latency_ms": t_xai,
            "explanations_generated": len(explanations)
        })

        # ---------------------------------------------------------------------
        # Step 7: Analytics Agent Execution (Metrics Summary)
        # ---------------------------------------------------------------------
        t0 = time.time()
        analytics_summary = await analytics_repo.get_metrics_summary()
        t_analytics = round((time.time() - t0) * 1000.0, 2)
        latency_breakdown["AnalyticsAgent"] = t_analytics
        agent_trace.append({
            "agent": "AnalyticsAgent",
            "status": "SUCCESS",
            "latency_ms": t_analytics
        })

        total_latency = round((time.time() - total_start) * 1000.0, 2)
        latency_breakdown["TotalExecutionTime"] = total_latency

        # Format Recommendations Output List
        recommendations_out = [
            {
                "id": item["product"].id,
                "title": item["product"].title,
                "category": item["product"].category,
                "brand": item["product"].brand,
                "price": item["product"].price,
                "rating": item["product"].rating,
                "image_url": item["product"].image_url,
                "match_score": item["score"]
            }
            for item in recs_raw
        ]

        return {
            "session_id": session_id,
            "guardrail_status": guardrail_result["flag"],
            "intent": {
                "active_label": intent_data.get("active_label"),
                "confidence": intent_data.get("confidence"),
                "history_timeline": intent_data.get("history", [])
            },
            "recommendations": recommendations_out,
            "bundles": bundles,
            "search_results": search_results,
            "explanations": explanations,
            "analytics": analytics_summary,
            "latency": latency_breakdown,
            "agent_trace": agent_trace
        }

brain_orchestrator = AIBrainOrchestrator()
