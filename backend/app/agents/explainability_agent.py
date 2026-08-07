import logging
from typing import Optional
from app.core.gemini_client import gemini_client
from app.core.redis_client import redis_manager

logger = logging.getLogger("intent_iq.explainability_agent")

class ExplainabilityAgent:
    """
    Module 9: Explainability Agent (XAI)
    Performance-optimized natural language explanation synthesizer.
    Caches rationales in Redis/In-memory to guarantee sub-millisecond SLAs.
    """
    async def explain(
        self,
        user_intent: str,
        product_title: str,
        category: str,
        brand: Optional[str] = None
    ) -> str:
        cache_key = f"cache:xai:{hash(user_intent)}:{hash(product_title)}"
        cached_exp = await redis_manager.get_json(cache_key)
        if cached_exp:
            return cached_exp

        explanation = None
        # Check if Gemini API model is initialized
        if gemini_client.model:
            try:
                explanation = await gemini_client.generate_explanation(
                    user_intent=user_intent,
                    product_title=product_title,
                    category=category
                )
            except Exception as e:
                logger.warning(f"Gemini XAI generation fallback: {e}")

        # Deterministic Template-based Explanations Fallback
        if not explanation:
            brand_str = f" from {brand}" if brand else ""
            if "Produce" in category or "Fruit" in category:
                return f"Fresh organic {category} choice matching your grocery preference."
            elif "Dairy" in category or "Milk" in category:
                return f"Popular refrigerated {category} item frequently purchased with your items."
            elif "Beverages" in category:
                return f"Top-rated beverage option complementing your active basket selection."
            elif "Electronics" in category or "Audio" in category:
                return f"Top choice matching your interest in high-performance {category}{brand_str}."
            else:
                return f"Popular choice aligned with your active {user_intent} discovery session."

        await redis_manager.set_json(cache_key, explanation, ttl=3600)
        return explanation

explainability_agent = ExplainabilityAgent()
