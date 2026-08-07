import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.agents.explainability_agent import explainability_agent
from app.models.schemas import ComponentScoreBreakdown, RecommendationDecisionTrace

@pytest.mark.asyncio
async def test_structured_xai_explanation():
    """Verify XAI explanations are evidence-based and grounded in actual breakdown scores."""
    score_breakdown = ComponentScoreBreakdown(
        semantic=0.92,
        graph=0.85,
        intent=0.88,
        budget=0.95,
        popularity=0.80,
        diversity_bonus=0.03,
        novelty_bonus=0.02,
        final_score=0.91
    )
    decision_trace = RecommendationDecisionTrace(
        similarity=0.92,
        basket_affinity=0.85,
        persona_match="Eco-conscious",
        budget_match="Compatible",
        diversity_bonus_applied=True,
        final_rank=1,
        final_score=0.91
    )

    xai = await explainability_agent.explain_structured(
        user_intent="Organic Produce",
        product_title="Organic Whole Milk",
        category="Dairy & Eggs",
        score_breakdown=score_breakdown,
        decision_trace=decision_trace
    )

    assert "Semantic similarity: 92%" in xai.supporting_signals[0]
    assert "Instacart order baskets" in xai.supporting_signals[1]
    assert xai.confidence >= 60 and xai.confidence <= 99
    assert xai.decision_trace is not None
