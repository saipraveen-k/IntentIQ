try:
    import faiss
    HAS_FAISS = True
except ImportError:
    HAS_FAISS = False

import numpy as np
import logging
from typing import List, Tuple, Dict, Any
from app.config import settings

logger = logging.getLogger("intent_iq.faiss")

class FAISSIndexManager:
    def __init__(self):
        self.dimension = settings.VECTOR_DIMENSION
        if HAS_FAISS:
            self.index = faiss.IndexFlatIP(self.dimension)
        else:
            self.index = None
            self.vectors = []
        self.id_map: Dict[int, str] = {} # FAISS int offset -> Product SKU ID
        self.sku_to_int: Dict[str, int] = {}
        self.is_initialized = False

    def add_products(self, products: List[Dict[str, Any]], embeddings: List[List[float]]):
        if not products or not embeddings:
            return
            
        vecs = np.array(embeddings, dtype=np.float32)
        # Normalize
        norms = np.linalg.norm(vecs, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        vecs = vecs / norms

        start_idx = len(self.id_map)
        
        if HAS_FAISS:
            self.index.add(vecs)
        else:
            if len(self.vectors) == 0:
                self.vectors = vecs
            else:
                self.vectors = np.vstack([self.vectors, vecs])
        
        for i, prod in enumerate(products):
            faiss_id = start_idx + i
            sku_id = prod["id"]
            self.id_map[faiss_id] = sku_id
            self.sku_to_int[sku_id] = faiss_id

        self.is_initialized = True
        logger.info(f"Vector index populated with {len(self.id_map)} vectors (FAISS Acceleration: {HAS_FAISS}).")

    def search(self, query_vector: List[float], top_k: int = 20) -> List[Tuple[str, float]]:
        if not self.is_initialized or len(self.id_map) == 0:
            return []

        q_vec = np.array([query_vector], dtype=np.float32)
        q_norm = np.linalg.norm(q_vec)
        if q_norm > 0:
            q_vec = q_vec / q_norm

        actual_k = min(top_k, len(self.id_map))

        if HAS_FAISS:
            distances, indices = self.index.search(q_vec, actual_k)
            dists_arr = distances[0]
            idxs_arr = indices[0]
        else:
            # NumPy cosine similarity dot product fallback
            sims = np.dot(self.vectors, q_vec.T).flatten()
            idxs_arr = np.argsort(-sims)[:actual_k]
            dists_arr = sims[idxs_arr]

        results = []
        for dist, idx in zip(dists_arr, idxs_arr):
            if idx in self.id_map:
                sku_id = self.id_map[idx]
                results.append((sku_id, float(dist)))

        return results

    def reset(self):
        if HAS_FAISS:
            self.index.reset()
        self.vectors = []
        self.id_map.clear()
        self.sku_to_int.clear()
        self.is_initialized = False

faiss_manager = FAISSIndexManager()

