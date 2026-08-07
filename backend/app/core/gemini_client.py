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
        self._exp_cache: Dict[str, str] = {}
        self._intent_cache: Dict[str, Dict[str, Any]] = {}

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
        cache_key = f"{user_intent}:{product_title}:{category}"
        if cache_key in self._exp_cache:
            return self._exp_cache[cache_key]

        res = None
        if self.model:
            try:
                import asyncio
                loop = asyncio.get_running_loop()
                response = await asyncio.wait_for(
                    loop.run_in_executor(None, self.model.generate_content, f"User Active Intent: '{user_intent}', Product: '{product_title}' ({category}). Write 1-sentence reason."),
                    timeout=0.15
                )
                if response and response.text:
                    res = response.text.strip()
            except Exception as e:
                logger.debug(f"Gemini API timeout or error: {e}. Switching to instant template synthesizer mode.")
                self.model = None

        if not res:
            if "Organic" in user_intent or "Healthy" in user_intent:
                res = f"Matches your active {user_intent} preference and fresh produce co-occurrence pattern."
            elif "Student" in user_intent or "Budget" in user_intent:
                res = f"Ideal budget-friendly selection aligned with active {user_intent} signals."
            elif "Luxury" in user_intent or "Gourmet" in user_intent:
                res = f"Artisanal choice matching your luxury gourmet preferences."
            else:
                res = f"Curated item aligned with your active {user_intent} shopping signals."

        if len(self._exp_cache) > 1000:
            self._exp_cache.clear()
        self._exp_cache[cache_key] = res
        return res

    async def extract_search_intents(self, query: str) -> Dict[str, Any]:
        if query in self._intent_cache:
            return self._intent_cache[query]

        res = None
        if self.model:
            try:
                import asyncio
                loop = asyncio.get_running_loop()
                response = await asyncio.wait_for(
                    loop.run_in_executor(None, self.model.generate_content, f"Parse query to JSON: '{query}'. Return {{'extracted_intents':[], 'budget_max': null}}"),
                    timeout=0.15
                )
                if response and response.text:
                    clean_text = response.text.strip().replace("```json", "").replace("```", "")
                    res = json.loads(clean_text)
            except Exception as e:
                logger.debug(f"Gemini intent extraction timeout or error: {e}. Switching to heuristic parser.")
                self.model = None


        if not res:
            words = query.lower().split()
            intents = [word.capitalize() for word in words if len(word) > 3 and word not in ["under", "with", "from", "that", "this", "for"]]
            budget = None
            for i, word in enumerate(words):
                if word in ["under", "below", "less"] and i + 1 < len(words):
                    try:
                        budget = float(words[i+1].replace("₹", "").replace("$", "").replace(",", ""))
                    except ValueError:
                        pass
            
            res = {
                "extracted_intents": intents if intents else ["General"],
                "budget_max": budget
            }

        if len(self._intent_cache) > 1000:
            self._intent_cache.clear()
        self._intent_cache[query] = res
        return res

gemini_client = GeminiClient()


