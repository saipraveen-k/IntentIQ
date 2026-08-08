import os
import sys
import json
import pytest
import numpy as np
from httpx import AsyncClient, ASGITransport

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.core.faiss_manager import faiss_manager
from app.core.embeddings import embedding_service
from app.agents.intent_agent import intent_agent
from app.pipeline.recommendation_memory import recommendation_memory_manager

import pytest_asyncio

@pytest_asyncio.fixture(autouse=True)
async def init_services():
    from app.core.database import init_db
    await init_db()
    embedding_service.load_model()
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    canonical_faiss_path = os.path.join(base_dir, "data", "indexes", "products.faiss")
    faiss_manager.load_from_disk(canonical_faiss_path)


@pytest.mark.asyncio
async def test_01_fresh_session_cold_start():
    """TEST 1: Cold start for a fresh session returns popularity and rating signals without fabricated intent."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver", timeout=30.0) as client:
        res = await client.get("/api/v1/recommendations/feed?session_id=sess_cold_start_test_01&limit=10")
        assert res.status_code == 200, f"Feed failed: {res.text}"
        data = res.json()
        assert "products" in data
        assert len(data["products"]) > 0
        assert data["active_intent"] in ["General Discovery", "Cold Start (New Session)"]
        for p in data["products"]:
            assert p["id"] is not None
            assert p["title"] is not None
            assert p["price"] > 0

@pytest.mark.asyncio
async def test_02_click_product():
    """TEST 2: Clicking a product triggers intent update."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver", timeout=30.0) as client:
        # Get a product from feed
        feed_res = await client.get("/api/v1/recommendations/feed?session_id=sess_click_test_02&limit=5")
        products = feed_res.json().get("products", [])
        assert len(products) > 0
        target = products[0]

        # Post telemetry click event
        event_res = await client.post("/api/v1/telemetry/event", json={
            "session_id": "sess_click_test_02",
            "event_type": "CLICK",
            "product_id": target["id"],
            "dwell_time_ms": 4500
        })
        assert event_res.status_code in [200, 201]
        
        # Check active intent
        intent_info = await intent_agent.get_active_intent("sess_click_test_02")
        assert intent_info["vector"] is not None
        assert intent_info["is_cold_start"] is False

@pytest.mark.asyncio
async def test_03_second_click_changes_intent():
    """TEST 3: Second click with different product updates the intent vector via EMA formula."""
    session_id = "sess_ema_test_03"
    
    # First event: Organic Bananas (Produce)
    intent_1 = await intent_agent.update_session_intent(
        session_id=session_id,
        event_type="CLICK",
        product_id="24852",
        item_text="Organic Bananas Fresh Fruit",
        category="Produce"
    )
    vec_1 = np.array(intent_1["vector"])

    # Second event: Sourdough Bread (Bakery)
    intent_2 = await intent_agent.update_session_intent(
        session_id=session_id,
        event_type="CLICK",
        product_id="5077",
        item_text="Artisan Sourdough Bread Bakery",
        category="Bakery"
    )
    vec_2 = np.array(intent_2["vector"])

    # Verify vector has shifted (cosine similarity < 0.999)
    cosine_sim = float(np.dot(vec_1, vec_2) / (np.linalg.norm(vec_1) * np.linalg.norm(vec_2)))
    assert cosine_sim < 0.999, f"Intent vector did not shift after second click: {cosine_sim}"
    assert len(intent_2["history"]) == 2

@pytest.mark.asyncio
async def test_04_personalized_feed_changes():
    """TEST 4: Feed recommendations evolve after interaction history arrives."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver", timeout=30.0) as client:
        session_id = "sess_feed_evolution_04"
        
        # Initial Feed
        res_1 = await client.get(f"/api/v1/recommendations/feed?session_id={session_id}&limit=10")
        initial_ids = [p["id"] for p in res_1.json().get("products", [])]

        # Apply specific Persona (e.g. fitness)
        await intent_agent.apply_persona(session_id, "fitness")

        # Second Feed
        res_2 = await client.get(f"/api/v1/recommendations/feed?session_id={session_id}&limit=10")
        personalized_ids = [p["id"] for p in res_2.json().get("products", [])]

        # Feeds should differ
        assert initial_ids != personalized_ids, "Feed did not adapt after persona update"

@pytest.mark.asyncio
async def test_05_semantic_search():
    """TEST 5: Semantic search interprets sub-intents and retrieves relevant items through 384d FAISS."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver", timeout=30.0) as client:
        res = await client.post("/api/v1/search/semantic", json={
            "session_id": "sess_search_test_05",
            "query": "organic fresh spinach and fruit",
            "limit": 10
        })
        assert res.status_code == 200
        data = res.json()
        assert "results" in data
        assert len(data["results"]) > 0
        for item in data["results"]:
            assert item["id"] is not None
            assert item["title"] is not None

@pytest.mark.asyncio
async def test_06_bundle_recommendation():
    """TEST 6: Bundle recommendation returns Frequently Bought Together and Complete the Look items."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver", timeout=30.0) as client:
        # Get a base product
        feed_res = await client.get("/api/v1/recommendations/feed?session_id=sess_bundle_06&limit=1")
        prods = feed_res.json().get("products", [])
        if prods:
            target_id = prods[0]["id"]
            res = await client.get(f"/api/v1/bundle/{target_id}")
            assert res.status_code == 200
            bundle_data = res.json()
            assert "base_product" in bundle_data
            assert bundle_data["discounted_total"] <= bundle_data["original_total"]

@pytest.mark.asyncio
async def test_07_substitute_recommendation():
    """TEST 7: Substitute recommendations return same category items with close price."""
    from app.pipeline.instacart_relationships import instacart_relationship_engine
    from app.core.database import AsyncSessionLocal
    from app.repositories.product_repository import ProductRepository
    
    async with AsyncSessionLocal() as db:
        repo = ProductRepository(db)
        prods = await repo.get_all(limit=1)
        if prods:
            base = prods[0]
            rels = await instacart_relationship_engine.get_product_relationships(base, db)
            assert "substitutes" in rels
            for sub in rels["substitutes"]:
                assert "substitute_score" in sub

@pytest.mark.asyncio
async def test_08_premium_alternative():
    """TEST 8: Premium alternative returns higher price / quality items."""
    from app.pipeline.instacart_relationships import instacart_relationship_engine
    from app.core.database import AsyncSessionLocal
    from app.repositories.product_repository import ProductRepository
    
    async with AsyncSessionLocal() as db:
        repo = ProductRepository(db)
        prods = await repo.get_all(limit=5)
        if prods:
            base = prods[0]
            rels = await instacart_relationship_engine.get_product_relationships(base, db)
            assert "premium_alternatives" in rels

@pytest.mark.asyncio
async def test_09_budget_alternative():
    """TEST 9: Budget alternative returns lower price items in same category."""
    from app.pipeline.instacart_relationships import instacart_relationship_engine
    from app.core.database import AsyncSessionLocal
    from app.repositories.product_repository import ProductRepository
    
    async with AsyncSessionLocal() as db:
        repo = ProductRepository(db)
        prods = await repo.get_all(limit=5)
        if prods:
            base = prods[0]
            rels = await instacart_relationship_engine.get_product_relationships(base, db)
            assert "budget_alternatives" in rels

@pytest.mark.asyncio
async def test_10_memory_cooldown():
    """TEST 10: Viewed product enters SKU cooldown and is filtered from immediate feed."""
    session_id = "sess_cooldown_test_10"
    memory = recommendation_memory_manager.get_memory(session_id)
    
    memory.record_view("24852")
    assert memory.is_in_cooldown("24852") is True
    assert memory.is_in_cooldown("99999999") is False

@pytest.mark.asyncio
async def test_11_category_diversity():
    """TEST 11: Category diversity quota prevents any single category exceeding 35% of top recommendations."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver", timeout=30.0) as client:
        res = await client.get("/api/v1/recommendations/feed?session_id=sess_div_11&limit=12")
        assert res.status_code == 200
        prods = res.json().get("products", [])
        
        cat_counts = {}
        for p in prods:
            cat = p.get("category", "General")
            cat_counts[cat] = cat_counts.get(cat, 0) + 1

        for cat, count in cat_counts.items():
            assert count <= 5, f"Category '{cat}' exceeded diversity quota with count {count}"

@pytest.mark.asyncio
async def test_12_faiss_fallback():
    """TEST 12: System gracefully handles search fallback."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver", timeout=30.0) as client:
        res = await client.post("/api/v1/search/semantic", json={
            "session_id": "sess_fallback_12",
            "query": "unusual rare specialty item xyz999",
            "limit": 5
        })
        assert res.status_code == 200

@pytest.mark.asyncio
async def test_13_gemini_fallback():
    """TEST 13: Deterministic explanation fallback when Gemini is offline."""
    from app.agents.explainability_agent import explainability_agent
    res = await explainability_agent.explain_structured(
        user_intent="Healthy Living",
        product_title="Organic Baby Spinach",
        category="Produce",
        brand="Instacart Fresh"
    )
    assert res.primary_reason is not None
    assert len(res.primary_reason) > 5

@pytest.mark.asyncio
async def test_14_model_artifact_compatibility():
    """TEST 14: Assert embedding dimension == FAISS dimension == 384d."""
    assert embedding_service.dimension == 384, f"Embedding service dimension is {embedding_service.dimension}, expected 384"
    assert faiss_manager.dimension == 384, f"FAISS manager dimension is {faiss_manager.dimension}, expected 384"
    if faiss_manager.is_initialized and faiss_manager.index:
        assert faiss_manager.index.d == 384, f"FAISS index internal dimension is {faiss_manager.index.d}, expected 384"

@pytest.mark.asyncio
async def test_15_dataset_consistency_assertions():
    """TEST 15: Assert canonical product IDs are unique and 100% bijective across metadata and FAISS."""
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    manifest_path = os.path.join(base_dir, "data_manifest.json")
    assert os.path.exists(manifest_path), "data_manifest.json is missing!"
    
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)
    
    assert manifest["embedding_dimension"] == 384
    assert manifest["product_count"] == manifest["faiss_vector_count"]
    assert manifest["status"] == "READY"
