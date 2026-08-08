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
    Real-Time Session Intent Agent:
    - Cold Start: Uses popularity, catalog quality, rating with no fabricated intent.
    - Real-Time Learning: intent_new = 0.8 * intent_old + 0.2 * event_embedding.
    - Stores session_id, event, product_id, old_intent_summary, new_intent_summary, intent_confidence.
    """
    def __init__(self):
        self.ema_alpha = 0.20
        self.event_weights = {
            "VIEW": 0.5,
            "CLICK": 1.0,
            "HOVER": 0.3,
            "WISHLIST": 1.8,
            "ADD_TO_CART": 2.5,
            "REMOVE_FROM_CART": -1.0,
            "PURCHASE": 3.0,
            "SEARCH": 1.5
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
            "is_cold_start": False,
            "vector": vec,
            "history": [
                {
                    "timestamp": datetime.utcnow().isoformat(),
                    "event_type": "PERSONA_SET",
                    "product_id": None,
                    "old_intent_summary": "Cold Start",
                    "new_intent_summary": profile["label"],
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
        product_id: Optional[str] = None,
        item_text: str = "",
        category: str = "",
        dwell_time_ms: int = 0,
        session_repo: Optional[SessionRepository] = None
    ) -> Dict[str, Any]:
        key = f"user_intent:{session_id}"
        existing_data = await redis_manager.get_json(key) or {}

        # Encode current event item representation
        event_text = f"{category} {item_text}".strip() or "General Product Discovery"
        event_vec = np.array(embedding_service.encode(event_text), dtype=np.float32)
        old_label = existing_data.get("active_label", "Cold Start Discovery")

        if "vector" in existing_data and existing_data["vector"]:
            old_vec = np.array(existing_data["vector"], dtype=np.float32)
            if event_type in ["DISMISS", "REMOVE", "REMOVE_FROM_CART", "DELETE", "DISLIKE"]:
                # Negative action: decrease affinity
                updated_vec = old_vec - (0.15 * event_vec)
                confidence = max(0.40, float(existing_data.get("confidence", 0.5)) - 0.05)
                new_label = old_label
            else:
                # Real-time EMA Formula: intent_new = 0.8 * intent_old + 0.2 * event_embedding
                updated_vec = (0.80 * old_vec) + (0.20 * event_vec)
                confidence = min(0.99, float(existing_data.get("confidence", 0.5)) + 0.08)
                new_label = f"Shopper interested in {category}" if category else old_label
        else:
            # First interaction transition from cold start
            updated_vec = event_vec
            confidence = 0.75
            new_label = f"Exploring {category}" if category else "Session Active"

        # Vector normalization to maintain unit hypersphere
        norm = np.linalg.norm(updated_vec)
        if norm > 0:
            updated_vec = updated_vec / norm

        history = existing_data.get("history", [])
        history.append({
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": event_type,
            "product_id": str(product_id) if product_id else None,
            "old_intent_summary": old_label,
            "new_intent_summary": new_label,
            "confidence": round(confidence, 2)
        })
        history = history[-10:]

        intent_payload = {
            "session_id": session_id,
            "active_label": new_label,
            "persona": existing_data.get("persona", "default"),
            "confidence": round(confidence, 2),
            "is_cold_start": False,
            "vector": updated_vec.tolist(),
            "history": history
        }

        await redis_manager.set_json(key, intent_payload, ttl=1800)

        if session_repo:
            await session_repo.upsert_session(
                session_id=session_id,
                active_intent=new_label,
                confidence=confidence,
                vector_json=updated_vec.tolist(),
                history_json=history
            )

        logger.info(f"Updated session {session_id} intent: '{old_label}' -> '{new_label}' (conf: {confidence:.2f})")
        return intent_payload

    async def get_active_intent(self, session_id: str) -> Dict[str, Any]:
        key = f"user_intent:{session_id}"
        data = await redis_manager.get_json(key)
        if data:
            return data
        
        # Cold start session: Return clean default cold-start metadata without fabricated intent
        return {
            "session_id": session_id,
            "active_label": "Cold Start (New Session)",
            "persona": "default",
            "confidence": 0.50,
            "is_cold_start": True,
            "vector": None,
            "history": []
        }

intent_agent = IntentAgent()
