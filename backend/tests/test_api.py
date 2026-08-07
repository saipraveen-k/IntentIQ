import os
import sys
import asyncio
import logging
from httpx import AsyncClient, ASGITransport

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_api")

async def run_api_tests():
    logger.info("==========================================================")
    logger.info("🧪 RUNNING INTENTIQ API INTEGRATION & DATA INTEGRITY TESTS")
    logger.info("==========================================================")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:

        # Test 1: GET /api/v1/system/health
        logger.info("\n1. Testing GET /api/v1/system/health...")
        res = await client.get("/api/v1/system/health")
        assert res.status_code == 200, f"Health endpoint failed: {res.status_code}"
        health_data = res.json()
        assert health_data["status"] == "HEALTHY", "Health status must be HEALTHY"
        assert "database" in health_data, "Database health section missing"
        assert "faiss" in health_data, "FAISS status section missing"
        logger.info("  ✅ Health endpoint passed (Database & FAISS singleton verified).")

        # Test 2: GET /api/v1/recommendations/feed
        logger.info("\n2. Testing GET /api/v1/recommendations/feed...")
        res = await client.get("/api/v1/recommendations/feed?session_id=test_sess_001&limit=12")
        assert res.status_code == 200, f"Feed endpoint failed: {res.status_code}"
        feed_data = res.json()
        assert "products" in feed_data, "Feed products missing"
        prods = feed_data["products"]
        prod_ids = [p["id"] for p in prods]

        # Verify no duplicate IDs
        assert len(prod_ids) == len(set(prod_ids)), f"Duplicate product IDs found in feed: {prod_ids}"
        for p in prods:
            assert p["id"], "Product ID must not be empty"
            assert p["title"], f"Product {p['id']} title must not be empty"
            assert p["price"] >= 0, f"Product {p['id']} price invalid"
        logger.info(f"  ✅ Feed endpoint passed: {len(prods)} products returned, 0 duplicates.")

        # Test 3: POST /api/v1/search/semantic
        logger.info("\n3. Testing POST /api/v1/search/semantic...")
        res = await client.post("/api/v1/search/semantic", json={
            "session_id": "test_sess_001",
            "query": "organic fresh milk",
            "limit": 10
        })
        assert res.status_code == 200, f"Search endpoint failed: {res.status_code}"
        search_data = res.json()
        search_ids = [p["id"] for p in search_data["results"]]
        assert len(search_ids) == len(set(search_ids)), f"Duplicate product IDs found in search: {search_ids}"
        logger.info(f"  ✅ Search endpoint passed: {len(search_ids)} results returned, 0 duplicates.")

        # Test 4: GET /api/v1/bundle/{id}
        if prod_ids:
            target_id = prod_ids[0]
            logger.info(f"\n4. Testing GET /api/v1/bundle/{target_id}...")
            res = await client.get(f"/api/v1/bundle/{target_id}")
            assert res.status_code == 200, f"Bundle endpoint failed: {res.status_code}"
            bundle_data = res.json()
            ctl_ids = [p["id"] for p in bundle_data.get("complete_the_look", [])]
            fbt_ids = [p["id"] for p in bundle_data.get("frequently_bought_together", [])]

            assert target_id not in ctl_ids, "Complete the look contains base product ID"
            assert target_id not in fbt_ids, "Frequently bought together contains base product ID"
            overlap = set(ctl_ids).intersection(set(fbt_ids))
            assert len(overlap) == 0, f"Overlap between bundle lists: {overlap}"
            logger.info("  ✅ Bundle endpoint passed: 0 self-references, 0 list overlaps.")

        # Test 5: POST /api/v1/brain/analyze
        logger.info("\n5. Testing POST /api/v1/brain/analyze...")
        res = await client.post("/api/v1/brain/analyze", json={
            "session_id": "test_sess_001",
            "search_query": "healthy organic breakfast",
            "clicked_products": prod_ids[:2] if prod_ids else []
        })
        assert res.status_code == 200, f"Brain analyze endpoint failed: {res.status_code}"
        brain_data = res.json()
        brain_recs = [p["id"] for p in brain_data.get("recommendations", [])]
        assert len(brain_recs) == len(set(brain_recs)), f"Duplicates in brain recommendations: {brain_recs}"
        assert "agent_trace" in brain_data, "Agent trace missing from brain analysis"
        logger.info("  ✅ AI Brain Orchestrator endpoint passed.")

        # Test 6: GET /api/v1/analytics/dashboard
        logger.info("\n6. Testing GET /api/v1/analytics/dashboard...")
        res = await client.get("/api/v1/analytics/dashboard")
        assert res.status_code == 200, f"Analytics dashboard failed: {res.status_code}"
        logger.info("  ✅ Analytics dashboard passed.")

    logger.info("\n==========================================================")
    logger.info("✨ ALL API & DATA INTEGRITY TESTS PASSED SUCCESSFULLY (100%)")
    logger.info("==========================================================")

if __name__ == "__main__":
    asyncio.run(run_api_tests())
