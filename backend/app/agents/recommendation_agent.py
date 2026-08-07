import logging
from typing import List, Tuple
from app.agents.intent_agent import intent_agent
from app.core.faiss_manager import faiss_manager

logger = logging.getLogger("intent_iq.recommendation_agent")

class RecommendationAgent:
    """
    Recommendation Agent:
    Personalizes feed candidates based on active session intent vectors.
    """
    async def get_personalized_candidates(self, session_id: str, limit: int = 20) -> Tuple[List[Tuple[str, float]], str]:
        intent_info = await intent_agent.get_active_intent(session_id)
        vector = intent_info.get("vector")
        active_label = intent_info.get("active_label", "Neutral")

        candidates = faiss_manager.search(vector, top_k=limit)
        return candidates, active_label

recommendation_agent = RecommendationAgent()
