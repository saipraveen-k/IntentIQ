import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_analytics_metrics_summary():
    """Verify system analytics dashboard retrieves actual database stats."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver", timeout=60.0) as client:
        res = await client.get("/api/v1/analytics/dashboard")
        assert res.status_code == 200
        data = res.json()
        assert "total_events_processed" in data
        assert "offline_metrics" in data
        assert "online_metrics" in data
        assert "conversion_funnel" in data
