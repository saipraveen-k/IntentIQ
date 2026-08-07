import os
import json
import logging
from typing import Optional, Dict, Any, List
from app.config import settings

logger = logging.getLogger("intent_iq.gemini")

# Module-level Google Generative AI import protection
genai_module = None
try:
    # pyrefly: ignore [missing-import]
    import google.generativeai as genai
    genai_module = genai
except ImportError:
    try:
        from google import genai
        genai_module = genai
    except ImportError:
        genai_module = None

class GeminiClient:
    def __init__(self):
        raw_keys = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", "")
        self.api_keys: List[str] = [k.strip() for k in raw_keys.split(",") if k.strip()]
        self.active_key_index: int = 0
        self.model = None

    def initialize(self):
        if self.api_keys and genai_module is not None:
            self._try_configure_active_key()
        elif genai_module is None:
            logger.info("google-generativeai package not installed. Operating in Template Synthesizer mode.")
            self.model = None
        else:
            logger.info("No GEMINI_API_KEY found. Operating in Template Synthesizer mode.")
            self.model = None

    def _try_configure_active_key(self) -> bool:
        if not self.api_keys or genai_module is None:
            return False
        
        current_key = self.api_keys[self.active_key_index]
        try:
            genai_module.configure(api_key=current_key)
            self.model = genai_module.GenerativeModel("gemini-1.5-flash")
            logger.info(f"Initialized Gemini 1.5 Flash API client with Key #{self.active_key_index + 1}.")
            return True
        except Exception as e:
            logger.warning(f"Could not initialize Gemini API Key #{self.active_key_index + 1} ({e}).")
            return self._switch_to_next_key()

    def _switch_to_next_key(self) -> bool:
        if len(self.api_keys) > 1 and self.active_key_index + 1 < len(self.api_keys):
            self.active_key_index += 1
            logger.info(f"Switching to fallback Gemini API Key #{self.active_key_index + 1}...")
            return self._try_configure_active_key()
        else:
            logger.warning("All provided Gemini API keys failed or exhausted. Operating in Template Synthesizer fallback mode.")
            self.model = None
            return False

    async def generate_explanation(self, user_intent: str, product_title: str, category: str) -> str:
        prompt = (
            f"You are an AI personalization engine for an e-commerce platform.\n"
            f"User Active Intent: '{user_intent}'\n"
            f"Product Title: '{product_title}' (Category: {category})\n"
            f"Write a concise, compelling 1-sentence explanation (under 15 words) for why this item is recommended to the user.\n"
            f"Do not use quotes or prefixes."
        )

        # Retry across configured keys if error occurs
        for _ in range(len(self.api_keys) or 1):
            if self.model:
                try:
                    response = self.model.generate_content(prompt)
                    if response and response.text:
                        return response.text.strip()
                except Exception as e:
                    logger.error(f"Gemini API error with Key #{self.active_key_index + 1}: {e}")
                    if not self._switch_to_next_key():
                        break

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
        prompt = (
            f"Parse this e-commerce search query into JSON:\n"
            f"Query: '{query}'\n"
            f"Return JSON object with keys: 'extracted_intents' (list of strings), 'budget_max' (number or null).\n"
            f"JSON ONLY."
        )

        for _ in range(len(self.api_keys) or 1):
            if self.model:
                try:
                    response = self.model.generate_content(prompt)
                    if response and response.text:
                        clean_text = response.text.strip().replace("```json", "").replace("```", "")
                        return json.loads(clean_text)
                except Exception as e:
                    logger.error(f"Gemini intent extraction error with Key #{self.active_key_index + 1}: {e}")
                    if not self._switch_to_next_key():
                        break

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
