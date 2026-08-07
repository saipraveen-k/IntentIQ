import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import asyncio
import logging
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_api")

@pytest.mark.asyncio
async def test_health_endpoint():
    """Test 1: GET /api/v1/system/health returns HEALTHY status."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver", timeout=30.0) as client:
        res = await client.get("/api/v1/system/health")
        assert res.status_code == 200, f"Health endpoint failed: {res.status_code}"
        health_data = res.json()
        assert health_data["status"] == "HEALTHY"
        assert "database" in health_data
        assert "faiss" in health_data
        logger.info("  ✅ Health endpoint passed.")

@pytest.mark.asyncio
async def test_recommendations_feed():
    """Test 2: GET /api/v1/recommendations/feed returns unique products."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver", timeout=30.0) as client:
        res = await client.get("/api/v1/recommendations/feed?session_id=pytest_live_01&limit=12")
        assert res.status_code == 200, f"Feed endpoint failed: {res.status_code}"
        feed_data = res.json()
        assert "products" in feed_data
        prods = feed_data["products"]
        prod_ids = [p["id"] for p in prods]

        # Verify no duplicate IDs in feed
        assert len(prod_ids) == len(set(prod_ids)), f"Duplicate product IDs in feed: {prod_ids}"
        for p in prods:
            assert p["id"]
            assert p["title"]
            assert p["price"] >= 0
        logger.info(f"  ✅ Feed endpoint passed ({len(prods)} products, 0 duplicates).")

@pytest.mark.asyncio
async def test_semantic_search():
    """Test 3: POST /api/v1/search/semantic returns relevant search results."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver", timeout=30.0) as client:
        res = await client.post("/api/v1/search/semantic", json={
            "session_id": "pytest_live_01",
            "query": "organic fresh milk",
            "limit": 10
        })
        assert res.status_code == 200, f"Search endpoint failed: {res.status_code}"
        search_data = res.json()
        search_ids = [p["id"] for p in search_data["results"]]
        assert len(search_ids) == len(set(search_ids)), f"Duplicate product IDs in search: {search_ids}"
        logger.info(f"  ✅ Semantic search endpoint passed ({len(search_ids)} results).")

@pytest.mark.asyncio
async def test_bundle_complete_the_look():
    """Test 4: GET /api/v1/bundle/{id} returns complete the look bundles without overlaps."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver", timeout=30.0) as client:
        feed_res = await client.get("/api/v1/recommendations/feed?session_id=pytest_live_01&limit=1")
        prods = feed_res.json().get("products", [])
        if prods:
            target_id = prods[0]["id"]
            res = await client.get(f"/api/v1/bundle/{target_id}")
            assert res.status_code == 200
            bundle_data = res.json()
            ctl_ids = [p["id"] for p in bundle_data.get("complete_the_look", [])]
            fbt_ids = [p["id"] for p in bundle_data.get("frequently_bought_together", [])]

            assert target_id not in ctl_ids, "Complete the look contains base product ID"
            assert target_id not in fbt_ids, "Frequently bought together contains base product ID"
            overlap = set(ctl_ids).intersection(set(fbt_ids))
            assert len(overlap) == 0, f"Overlap between bundle lists: {overlap}"
            logger.info("  ✅ Bundle endpoint passed (0 self-references, 0 overlaps).")

@pytest.mark.asyncio
async def test_brain_orchestrator():
    """Test 5: POST /api/v1/brain/analyze executes AI Brain orchestrator pipeline."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver", timeout=30.0) as client:
        res = await client.post("/api/v1/brain/analyze", json={
            "session_id": "pytest_live_01",
            "search_query": "healthy organic breakfast",
            "clicked_products": []
        })
        assert res.status_code == 200
        brain_data = res.json()
        assert "agent_trace" in brain_data
        assert "recommendations" in brain_data
        assert "explanations" in brain_data
        assert brain_data["guardrail_status"] == "CLEAN"
        logger.info("  ✅ AI Brain Orchestrator endpoint passed.")

@pytest.mark.asyncio
async def test_guardrail_injection_prevention():
    """Test 6: Guardrail blocks prompt injection safely."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver", timeout=30.0) as client:
        res = await client.post("/api/v1/brain/analyze", json={
            "session_id": "pytest_live_01",
            "search_query": "SELECT * FROM users WHERE 1=1; DROP TABLE products;",
            "clicked_products": []
        })
        assert res.status_code == 200
        brain_data = res.json()
        assert brain_data["guardrail_status"] != "CLEAN"
        logger.info("  ✅ Guardrail injection prevention passed.")

@pytest.mark.asyncio
async def test_analytics_dashboard():
    """Test 7: GET /api/v1/analytics/dashboard returns dashboard metrics."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver", timeout=30.0) as client:
        res = await client.get("/api/v1/analytics/dashboard")
        assert res.status_code == 200
        data = res.json()
        assert "total_events_processed" in data or "active_sessions" in data
        logger.info("  ✅ Analytics dashboard endpoint passed.")
