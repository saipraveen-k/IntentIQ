import numpy as np
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.core.redis_client import redis_manager
from app.core.embeddings import embedding_service
from app.repositories.session_repository import SessionRepository

logger = logging.getLogger("intent_iq.intent_agent")

class IntentAgent:
    """
    Module 5: Intent Agent
    Multi-signal real-time intent vector calculation with exponential decay weighting.
    Signals: CLICK (1.0), HOVER (0.5 * dwell_sec), SEARCH (1.5), WISHLIST (2.0), ADD_TO_CART (2.5).
    Tracks active intent label, confidence score, and vector history timeline.
    """
    def __init__(self):
        self.decay_factor = 0.82
        self.event_weights = {
            "CLICK": 1.0,
            "HOVER": 0.5,
            "SEARCH": 1.5,
            "WISHLIST": 2.0,
            "ADD_TO_CART": 2.5
        }

    async def update_session_intent(
        self,
        session_id: str,
        event_type: str,
        item_text: str,
        category: str,
        dwell_time_ms: int = 0,
        session_repo: Optional[SessionRepository] = None
    ) -> Dict[str, Any]:
        key = f"user_intent:{session_id}"
        existing_data = await redis_manager.get_json(key) or {}

        # Signal weight computation
        base_weight = self.event_weights.get(event_type.upper(), 1.0)
        if event_type.upper() == "HOVER" and dwell_time_ms > 0:
            dwell_sec = min(dwell_time_ms / 1000.0, 10.0)
            base_weight = 0.5 * dwell_sec

        new_vec = np.array(embedding_service.encode(f"{category} {item_text}"), dtype=np.float32)

        if "vector" in existing_data and existing_data["vector"]:
            old_vec = np.array(existing_data["vector"], dtype=np.float32)
            updated_vec = (old_vec * self.decay_factor) + (new_vec * base_weight * (1.0 - self.decay_factor))
            confidence = min(0.99, float(existing_data.get("confidence", 0.5)) + 0.08)
        else:
            updated_vec = new_vec
            confidence = 0.75

        # Vector normalization
        norm = np.linalg.norm(updated_vec)
        if norm > 0:
            updated_vec = updated_vec / norm

        label = category if category else "General Discovery"
        history = existing_data.get("history", [])
        
        # Append to intent history timeline
        history.append({
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": event_type,
            "intent_label": label,
            "confidence": round(confidence, 2)
        })
        # Keep last 10 historical shifts
        history = history[-10:]

        intent_payload = {
            "session_id": session_id,
            "active_label": label,
            "confidence": round(confidence, 2),
            "vector": updated_vec.tolist(),
            "history": history
        }

        await redis_manager.set_json(key, intent_payload, ttl=1800)

        # Persist session to database repository if provided
        if session_repo:
            await session_repo.upsert_session(
                session_id=session_id,
                active_intent=label,
                confidence=confidence,
                vector_json=updated_vec.tolist(),
                history_json=history
            )

        return intent_payload

    async def get_active_intent(self, session_id: str) -> Dict[str, Any]:
        key = f"user_intent:{session_id}"
        data = await redis_manager.get_json(key)
        if data:
            return data
        
        # Default cold start vector
        default_vec = embedding_service.encode("Trending Popular Product Discovery")
        return {
            "session_id": session_id,
            "active_label": "Neutral (Cold Start)",
            "confidence": 0.50,
            "vector": default_vec,
            "history": []
        }

intent_agent = IntentAgent()
