import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_cold_start_recommendations():
    """Verify cold start users (no history) receive valid recommendations."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver", timeout=30.0) as client:
        res = await client.get("/api/v1/recommendations/feed?session_id=cold_start_sess_99&limit=10")
        assert res.status_code == 200
        data = res.json()
        assert "products" in data
        assert len(data["products"]) > 0

@pytest.mark.asyncio
async def test_category_diversity_quota():
    """Verify category diversity quota prevents single-category dominance."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver", timeout=30.0) as client:
        res = await client.get("/api/v1/recommendations/feed?session_id=diversity_sess_88&limit=12")
        assert res.status_code == 200
        prods = res.json().get("products", [])
        
        cat_counts = {}
        for p in prods:
            cat = p.get("category", "General")
            cat_counts[cat] = cat_counts.get(cat, 0) + 1

        for cat, count in cat_counts.items():
            assert count <= 4, f"Category '{cat}' exceeded diversity limit with count {count}"
