import time
import logging
from typing import Dict, Any, List, Tuple
from app.core.embeddings import embedding_service
from app.core.faiss_manager import faiss_manager
from app.core.gemini_client import gemini_client

logger = logging.getLogger("intent_iq.search_agent")

class SemanticSearchAgent:
    """
    Semantic Search Agent:
    Decomposes multi-intent queries, generates dense embeddings, and queries FAISS.
    """
    async def execute_search(self, query: str, top_k: int = 12) -> Tuple[List[Tuple[str, float]], Dict[str, Any], float]:
        start_time = time.time()

        # Step 1: Extract sub-intents & constraints via Gemini / Heuristics
        intent_metadata = await gemini_client.extract_search_intents(query)

        # Step 2: Dense embedding generation
        query_vec = embedding_service.encode(query)

        # Step 3: FAISS Vector retrieval
        candidates = faiss_manager.search(query_vec, top_k=top_k)

        latency_ms = (time.time() - start_time) * 1000.0
        return candidates, intent_metadata, latency_ms

search_agent = SemanticSearchAgent()
