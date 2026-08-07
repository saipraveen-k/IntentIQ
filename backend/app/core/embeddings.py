import numpy as np
import logging
from typing import List
from app.config import settings

logger = logging.getLogger("intent_iq.embeddings")

class EmbeddingService:
    def __init__(self):
        self.model = None
        self.dimension = settings.VECTOR_DIMENSION

    def load_model(self):
        try:
            from sentence_transformers import SentenceTransformer
            logger.info(f"Loading SentenceTransformers model: {settings.EMBEDDING_MODEL_NAME}")
            self.model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
            logger.info("SentenceTransformers model loaded successfully.")
        except Exception as e:
            logger.warning(f"Could not load SentenceTransformers ({e}). Using normalized deterministic hash embeddings fallback.")
            self.model = None

    def encode(self, text: str) -> List[float]:
        if self.model:
            vec = self.model.encode(text, convert_to_numpy=True)
            # Normalize
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec = vec / norm
            return vec.tolist()
        else:
            # Deterministic fallback vector generator for testing without heavy model downloads
            np.random.seed(abs(hash(text)) % (2**32 - 1))
            vec = np.random.randn(self.dimension).astype(np.float32)
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec = vec / norm
            return vec.tolist()

    def encode_batch(self, texts: List[str]) -> List[List[float]]:
        return [self.encode(t) for t in texts]

embedding_service = EmbeddingService()
