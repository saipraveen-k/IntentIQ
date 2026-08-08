import numpy as np
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.core.redis_client import redis_manager
from app.core.embeddings import embedding_service
from app.repositories.session_repository import SessionRepository

logger = logging.getLogger("intent_iq.intent_agent")

PERSONA_PROFILES = {
    "healthy": {"label": "Healthy Lifestyle & Organic", "text": "Organic fresh produce, detox cold-pressed juice, low sugar oats, Greek yogurt"},
    "student": {"label": "College Student Quick Meals", "text": "Instant ramen noodles, energy drinks, microwave snacks, budget cereal"},
    "luxury": {"label": "Luxury Gourmet Artisanal", "text": "Imported truffle oil, artisanal sourdough, fine cheeses, premium cold cuts"},
    "family": {"label": "Family Shopping & Pantry", "text": "Bulk family pack snacks, organic milk, whole wheat bread, cereal, pasta"},
    "fitness": {"label": "Fitness Enthusiast High Protein", "text": "Whey protein isolate, egg whites, chicken breast, Greek yogurt, almonds"},
    "budget": {"label": "Budget Essential Deals", "text": "Low cost pantry staples, discounted rice, beans, store brand eggs"},
    "weekend": {"label": "Weekend Cooking & Baking", "text": "Baking flour, pure vanilla extract, sea salt butter, herbs, marinades"}
}

class IntentAgent:
    """
    Phase 3 & 4 Agent 1: Intent Agent
    Multi-signal real-time intent vector calculation with EMA update formula:
    NewIntent = 0.8 * PreviousIntent + 0.2 * CurrentEmbedding
    Supports 7 preset Shopping Personas for interactive demonstration.
    """
    def __init__(self):
        self.ema_alpha = 0.20
        self.event_weights = {
            "CLICK": 1.0,
            "HOVER": 0.5,
            "SEARCH": 1.5,
            "WISHLIST": 2.0,
            "ADD_TO_CART": 2.5,
            "PURCHASE": 3.0
        }

    async def apply_persona(self, session_id: str, persona_key: str, session_repo: Optional[SessionRepository] = None) -> Dict[str, Any]:
        key = f"user_intent:{session_id}"
        profile = PERSONA_PROFILES.get(persona_key.lower(), PERSONA_PROFILES["healthy"])
        
        vec = embedding_service.encode(f"{profile['label']} {profile['text']}")
        intent_payload = {
            "session_id": session_id,
            "active_label": profile["label"],
            "persona": persona_key.lower(),
            "confidence": 0.95,
            "vector": vec,
            "history": [
                {
                    "timestamp": datetime.utcnow().isoformat(),
                    "event_type": "PERSONA_SET",
                    "intent_label": profile["label"],
                    "confidence": 0.95
                }
            ]
        }
        await redis_manager.set_json(key, intent_payload, ttl=1800)
        if session_repo:
            await session_repo.upsert_session(
                session_id=session_id,
                active_intent=profile["label"],
                confidence=0.95,
                vector_json=vec,
                history_json=intent_payload["history"]
            )
        return intent_payload

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

        new_vec = np.array(embedding_service.encode(f"{category} {item_text}"), dtype=np.float32)

        if "vector" in existing_data and existing_data["vector"]:
            old_vec = np.array(existing_data["vector"], dtype=np.float32)
            if event_type in ["DISMISS", "REMOVE", "DELETE", "DISLIKE", "NEGATIVE"]:
                # Negative action: decrease affinity by subtracting event embedding
                updated_vec = old_vec - (0.15 * new_vec)
                confidence = max(0.40, float(existing_data.get("confidence", 0.5)) - 0.05)
            else:
                # EMA Update: 0.8 * old + 0.2 * new
                updated_vec = ((1.0 - self.ema_alpha) * old_vec) + (self.ema_alpha * new_vec)
                confidence = min(0.99, float(existing_data.get("confidence", 0.5)) + 0.05)
        else:
            if event_type in ["DISMISS", "REMOVE", "DELETE", "DISLIKE", "NEGATIVE"]:
                updated_vec = -0.15 * new_vec
                confidence = 0.50
            else:
                updated_vec = new_vec
                confidence = 0.78

        # Vector normalization
        norm = np.linalg.norm(updated_vec)
        if norm > 0:
            updated_vec = updated_vec / norm

        label = category if category else "General Discovery"
        history = existing_data.get("history", [])
        
        history.append({
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": event_type,
            "intent_label": label,
            "confidence": round(confidence, 2)
        })
        history = history[-10:]

        intent_payload = {
            "session_id": session_id,
            "active_label": label,
            "persona": existing_data.get("persona", "default"),
            "confidence": round(confidence, 2),
            "vector": updated_vec.tolist(),
            "history": history
        }

        await redis_manager.set_json(key, intent_payload, ttl=1800)

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
        
        default_vec = embedding_service.encode("Trending Popular Product Discovery")
        return {
            "session_id": session_id,
            "active_label": "Neutral (Cold Start)",
            "persona": "default",
            "confidence": 0.50,
            "vector": default_vec,
            "history": []
        }

intent_agent = IntentAgent()

