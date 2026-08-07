import os
import json
import logging
from typing import Optional, Dict, Any
from app.config import settings

logger = logging.getLogger("intent_iq.gemini")

class GeminiClient:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", "")
        self.model = None

    def initialize(self):
        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel("gemini-1.5-flash")
                logger.info("Initialized Gemini 1.5 Flash API client.")
            except Exception as e:
                logger.warning(f"Could not initialize Gemini API ({e}). Falling back to template rationale synthesizer.")
                self.model = None
        else:
            logger.info("No GEMINI_API_KEY found. Operating in Template Synthesizer mode.")
            self.model = None

    async def generate_explanation(self, user_intent: str, product_title: str, category: str) -> str:
        if self.model:
            prompt = (
                f"You are an AI personalization engine for an e-commerce platform.\n"
                f"User Active Intent: '{user_intent}'\n"
                f"Product Title: '{product_title}' (Category: {category})\n"
                f"Write a concise, compelling 1-sentence explanation (under 15 words) for why this item is recommended to the user.\n"
                f"Do not use quotes or prefixes."
            )
            try:
                response = self.model.generate_content(prompt)
                if response and response.text:
                    return response.text.strip()
            except Exception as e:
                logger.error(f"Gemini API error: {e}")

        # High-quality fallback template rationale
        if "Decor" in user_intent or "Lighting" in user_intent:
            return f"Matches your recent interest in {user_intent} and interior accents."
        elif "Work" in user_intent or "Office" in user_intent or "Desk" in user_intent:
            return f"Perfect complement for your active {user_intent} setup."
        elif "Audio" in user_intent or "Tech" in user_intent:
            return f"Top choice based on your views in high-performance {category}."
        else:
            return f"Popular item aligned with your active {user_intent} signals."

    async def extract_search_intents(self, query: str) -> Dict[str, Any]:
        if self.model:
            prompt = (
                f"Parse this e-commerce search query into JSON:\n"
                f"Query: '{query}'\n"
                f"Return JSON object with keys: 'extracted_intents' (list of strings), 'budget_max' (number or null).\n"
                f"JSON ONLY."
            )
            try:
                response = self.model.generate_content(prompt)
                if response and response.text:
                    clean_text = response.text.strip().replace("```json", "").replace("```", "")
                    return json.loads(clean_text)
            except Exception as e:
                logger.error(f"Gemini intent extraction error: {e}")

        # Fallback heuristic parser
        words = query.lower().split()
        intents = [word.capitalize() for word in words if len(word) > 3 and word not in ["under", "with", "from", "that", "this", "for"]]
        budget = None
        for i, word in enumerate(words):
            if word in ["under", "below", "less"] and i + 1 < len(words):
                try:
                    budget = float(words[i+1].replace("₹", "").replace("$", "").replace(",", ""))
                except ValueError:
                    pass
        
        return {
            "extracted_intents": intents if intents else ["General"],
            "budget_max": budget
        }

gemini_client = GeminiClient()
