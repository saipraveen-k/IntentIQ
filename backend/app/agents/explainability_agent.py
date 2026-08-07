import logging
from app.core.gemini_client import gemini_client

logger = logging.getLogger("intent_iq.explainability_agent")

class ExplainabilityAgent:
    """
    Explainability Agent (XAI):
    Generates natural language rationales for recommended products using Gemini 1.5 Flash.
    """
    async def generate_rationale(self, user_intent: str, product_title: str, category: str) -> str:
        return await gemini_client.generate_explanation(user_intent, product_title, category)

explainability_agent = ExplainabilityAgent()
