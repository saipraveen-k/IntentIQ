import os
import logging
from typing import List, Tuple
from app.config import settings

logger = logging.getLogger("intent_iq.cross_encoder")

class CrossEncoderService:
    """
    Singleton service for cross-encoder reranking.
    Only reranks a small candidate subset (<= 20 candidates) to keep latency under 80ms.
    """
    def __init__(self):
        self.model = None
        self.model_name = "cross-encoder/ms-marco-MiniLM-L-6-v2"
        self.is_loaded = False

    def load_model(self):
        if self.is_loaded:
            return
        try:
            from sentence_transformers import CrossEncoder
            logger.info(f"Loading CrossEncoder model: {self.model_name}...")
            self.model = CrossEncoder(self.model_name)
            self.is_loaded = True
            logger.info("CrossEncoder model loaded successfully.")
        except Exception as e:
            logger.warning(f"CrossEncoder model unavailable ({e}). Using semantic similarity score fallback.")
            self.model = None
            self.is_loaded = False

    def rerank(self, query: str, candidate_texts: List[str], top_k: int = 10) -> List[Tuple[int, float]]:
        """
        Reranks up to 20 candidate texts against the query.
        Returns list of (candidate_index, score) sorted descending.
        """
        if not candidate_texts:
            return []
        
        # Enforce max 20 candidates to preserve low latency SLA
        candidates_to_score = candidate_texts[:20]
        
        if self.model and self.is_loaded:
            try:
                pairs = [[query, text] for text in candidates_to_score]
                scores = self.model.predict(pairs)
                indexed_scores = [(idx, float(score)) for idx, score in enumerate(scores)]
                indexed_scores.sort(key=lambda x: x[1], reverse=True)
                return indexed_scores[:top_k]
            except Exception as e:
                logger.warning(f"CrossEncoder prediction error: {e}")
        
        # Fallback: maintain original ordering with linear decay
        return [(i, 1.0 - (i * 0.05)) for i in range(min(top_k, len(candidates_to_score)))]

cross_encoder_service = CrossEncoderService()
