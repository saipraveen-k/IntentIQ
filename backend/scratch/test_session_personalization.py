import asyncio
import os
import sys
import numpy as np
from httpx import AsyncClient, ASGITransport

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.main import app
from app.core.database import init_db
from app.core.embeddings import embedding_service
from app.core.faiss_manager import faiss_manager
from app.agents.intent_agent import intent_agent

async def run_experiment():
    # Pre-initialize services & FAISS
    await init_db()
    embedding_service.load_model()
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    canonical_faiss_path = os.path.join(base_dir, "data", "indexes", "products.faiss")
    faiss_manager.load_from_disk(canonical_faiss_path)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver", timeout=30.0) as client:
        session_id = "test_persona_exp_002"

        # 1. Feed 1: Cold Start / Empty Session
        res1 = await client.get(f"/api/v1/recommendations/feed?session_id={session_id}&limit=6")
        assert res1.status_code == 200
        feed1_data = res1.json()
        prods1 = feed1_data.get("products", [])
        intent1 = await intent_agent.get_active_intent(session_id)

        print("\n=== BEFORE (Cold Start Session) ===")
        print(f"Active Intent: {intent1['active_label']} | Cold Start: {intent1['is_cold_start']}")
        for idx, p in enumerate(prods1, 1):
            trace = p.get("decision_trace") or {}
            score = trace.get("final_score") or p.get("match_score") or 0.0
            print(f"{idx}. [{p['id']}] {p['title']} ({p['category']}) - Score: {score:.4f}")

        # 2. Action 1: Search "high protein breakfast"
        search_res = await client.post("/api/v1/search/semantic", json={
            "session_id": session_id,
            "query": "organic fresh spinach and fruit",
            "limit": 5
        })
        assert search_res.status_code == 200
        search_results = search_res.json().get("results", [])
        assert len(search_results) > 0
        target_prod = search_results[0]

        # 3. Action 2: Click target product
        await client.post("/api/v1/telemetry/event", json={
            "session_id": session_id,
            "event_type": "CLICK",
            "product_id": target_prod["id"],
            "dwell_time_ms": 5200
        })

        # 4. Action 3: Add to cart
        await client.post("/api/v1/telemetry/event", json={
            "session_id": session_id,
            "event_type": "ADD_TO_CART",
            "product_id": target_prod["id"],
            "dwell_time_ms": 1200
        })

        # 5. Feed 2: Post-Interaction Personalized Feed
        res2 = await client.get(f"/api/v1/recommendations/feed?session_id={session_id}&limit=6")
        assert res2.status_code == 200
        feed2_data = res2.json()
        prods2 = feed2_data.get("products", [])
        intent2 = await intent_agent.get_active_intent(session_id)

        print("\n=== AFTER ORGANIC SPINACH & FRUIT SEARCH & CLICKS ===")
        print(f"Active Intent: {intent2['active_label']} | Cold Start: {intent2['is_cold_start']} | Confidence: {intent2['confidence']}")
        for idx, p in enumerate(prods2, 1):
            trace = p.get("decision_trace") or {}
            score = trace.get("final_score") or p.get("match_score") or 0.0
            print(f"{idx}. [{p['id']}] {p['title']} ({p['category']}) - Score: {score:.4f}")

        # 6. Intent Vector Shift Calculation
        vec1 = intent1.get("vector")
        vec2 = intent2.get("vector")
        shift_metric = "Vector Initialized from None" if vec1 is None else f"Cosine Similarity = {np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2)):.4f}"

        print("\n=== EXPERIMENT VERIFICATION RESULTS ===")
        print(f"INTENT CHANGE: {intent1['active_label']} -> {intent2['active_label']}")
        print(f"VECTOR SHIFT: {shift_metric}")
        print(f"FEED DIFFERENT: {prods1 != prods2}")
        print(f"TOP ITEM 1: {prods1[0]['title']} -> TOP ITEM 2: {prods2[0]['title']}")

if __name__ == "__main__":
    asyncio.run(run_experiment())
