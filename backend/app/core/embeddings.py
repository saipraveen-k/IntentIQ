import numpy as np
import logging
from typing import List, Dict
from app.config import settings

logger = logging.getLogger("intent_iq.embeddings")

class EmbeddingService:
    def __init__(self):
        self.model = None
        self.dimension = settings.VECTOR_DIMENSION
        self._cache: Dict[str, List[float]] = {}

    def load_model(self):
        try:
            from sentence_transformers import SentenceTransformer
            logger.info(f"Loading SentenceTransformers model: {settings.EMBEDDING_MODEL_NAME}")
            self.model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
            logger.info("SentenceTransformers model loaded successfully. Pre-warming model inference engine...")
            self.encode_batch(["Warmup initial vector model query 1", "Warmup initial vector model query 2"])
            logger.info("SentenceTransformers model pre-warmed successfully.")
        except Exception as e:
            logger.warning(f"Could not load SentenceTransformers ({e}). Using normalized deterministic hash embeddings fallback.")
            self.model = None

    def encode(self, text: str) -> List[float]:
        if text in self._cache:
            return self._cache[text]

        if self.model:
            vec = self.model.encode(text, convert_to_numpy=True, show_progress_bar=False)
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec = vec / norm
            res = vec.tolist()
        else:
            # Deterministic fallback vector generator for testing without heavy model downloads
            np.random.seed(abs(hash(text)) % (2**32 - 1))
            vec = np.random.randn(self.dimension).astype(np.float32)
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec = vec / norm
            res = vec.tolist()

        if len(self._cache) > 2000:
            self._cache.clear()
        self._cache[text] = res
        return res

    def encode_batch(self, texts: List[str]) -> List[List[float]]:
        if self.model:
            vecs = self.model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
            res = []
            for vec in vecs:
                norm = np.linalg.norm(vec)
                if norm > 0:
                    vec = vec / norm
                res.append(vec.tolist())
            return res
        return [self.encode(t) for t in texts]


embedding_service = EmbeddingService()

