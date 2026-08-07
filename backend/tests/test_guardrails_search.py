import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.agents.guardrail_agent import guardrail_agent

def test_guardrail_sanitization():
    """Verify guardrail detects unsafe inputs."""
    safe_res = guardrail_agent.validate_and_sanitize("organic fresh almond milk")
    assert safe_res["is_safe"] == True

    unsafe_res = guardrail_agent.validate_and_sanitize("SELECT * FROM users WHERE 1=1; DROP TABLE products;")
    assert unsafe_res["is_safe"] == False

@pytest.mark.asyncio
async def test_semantic_search_execution():
    """Verify semantic search endpoint returns relevant product results."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver", timeout=30.0) as client:
        res = await client.post("/api/v1/search/semantic", json={
            "session_id": "search_sess_01",
            "query": "healthy breakfast snacks",
            "limit": 5
        })
        assert res.status_code == 200
        data = res.json()
        assert "results" in data
        assert len(data["results"]) > 0
