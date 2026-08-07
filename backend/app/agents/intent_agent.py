import numpy as np
import logging
from typing import Dict, Any, List
from app.core.redis_client import redis_manager
from app.core.embeddings import embedding_service

logger = logging.getLogger("intent_iq.intent_agent")

class IntentAgent:
    """
    User Intent Agent:
    Maintains real-time user intent vectors with exponential decay updates.
    """
    def __init__(self):
        self.decay_factor = 0.85 # Decay past intent by 15% per new event

    async def update_intent_vector(self, session_id: str, item_text: str, category: str) -> str:
        key = f"user_intent:{session_id}"
        existing_data = await redis_manager.get_json(key)

        new_vec = np.array(embedding_service.encode(f"{category} {item_text}"), dtype=np.float32)

        if existing_data and "vector" in existing_data:
            old_vec = np.array(existing_data["vector"], dtype=np.float32)
            updated_vec = (old_vec * self.decay_factor) + (new_vec * (1.0 - self.decay_factor))
        else:
            updated_vec = new_vec

        # Normalize
        norm = np.linalg.norm(updated_vec)
        if norm > 0:
            updated_vec = updated_vec / norm

        label = category if category else "General Discovery"

        await redis_manager.set_json(key, {
            "session_id": session_id,
            "active_label": label,
            "vector": updated_vec.tolist()
        }, ttl=1800)

        return label

    async def get_active_intent(self, session_id: str) -> Dict[str, Any]:
        key = f"user_intent:{session_id}"
        data = await redis_manager.get_json(key)
        if data:
            return data
        
        # Default cold start intent
        default_vec = embedding_service.encode("Trending Popular Discovery")
        return {
            "session_id": session_id,
            "active_label": "Neutral (Cold Start)",
            "vector": default_vec
        }

intent_agent = IntentAgent()
