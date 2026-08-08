import os
import pickle
import logging
import numpy as np
from typing import List, Tuple, Dict, Any, Optional
from app.config import settings

try:
    import faiss
    HAS_FAISS = True
except ImportError:
    HAS_FAISS = False

logger = logging.getLogger("intent_iq.faiss")

class FAISSIndexManager:
    """
    Unified canonical FAISS Index Manager.
    Contract:
    - Standardized 384-dimensional vector space.
    - Single canonical index location: backend/data/indexes/products.faiss.
    - Methods: load(), search(), rebuild(), validate(), save().
    - Startup verification: product_count == embedding_count == faiss_count.
    """
    def __init__(self):
        self.dimension = settings.VECTOR_DIMENSION # 384
        self.index = faiss.IndexFlatIP(self.dimension) if HAS_FAISS else None
        self.vectors = np.empty((0, self.dimension), dtype=np.float32)
        self.id_map: Dict[int, str] = {}      # FAISS integer offset -> Product ID
        self.sku_to_int: Dict[str, int] = {}  # Product ID -> FAISS integer offset
        self.is_initialized = False
        self.status = "NOT_INITIALIZED"
        self.canonical_path = ""

    def load(self, filepath: Optional[str] = None) -> bool:
        return self.load_from_disk(filepath)

    def load_from_disk(self, filepath: Optional[str] = None) -> bool:
        if not filepath:
            # Default canonical index path
            base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
            filepath = os.path.join(base_dir, "data", "indexes", "products.faiss")
            
        if self.is_initialized and self.index and self.canonical_path == filepath:
            return True

        meta_filepath = filepath + ".meta"
        self.canonical_path = filepath

        if not os.path.exists(filepath) or not os.path.exists(meta_filepath):
            logger.warning(f"Canonical FAISS index file not found at {filepath}. Attempting legacy fallback...")
            # Fallback check
            alt_path = os.path.join(os.path.dirname(filepath), "..", "faiss_index.bin")
            if os.path.exists(alt_path) and os.path.exists(alt_path + ".meta"):
                filepath = alt_path
                meta_filepath = alt_path + ".meta"
            else:
                self.status = "DEGRADED — INDEX FILE MISSING"
                return False

        try:
            if HAS_FAISS:
                self.index = faiss.read_index(filepath)
                if self.index.d != self.dimension:
                    logger.error(f"FAISS index dimension mismatch! Index has {self.index.d}d, expected {self.dimension}d.")
                    self.status = f"DEGRADED — DIMENSION MISMATCH ({self.index.d} vs {self.dimension})"
                    return False
            else:
                with open(filepath, "rb") as f:
                    self.vectors = pickle.load(f)

            with open(meta_filepath, "rb") as f:
                meta = pickle.load(f)
                self.id_map = {int(k): str(v) for k, v in meta.get("id_map", {}).items()}
                self.sku_to_int = {str(k): int(v) for k, v in meta.get("sku_to_int", {}).items()}

            self.is_initialized = True
            self.status = "READY"
            logger.info(f"Loaded canonical FAISS index with {len(self.id_map):,} vectors from {filepath}.")
            return True
        except Exception as e:
            logger.error(f"Error loading FAISS index from disk: {e}")
            self.status = f"DEGRADED — LOAD ERROR: {str(e)}"
            return False

    def validate(self, canonical_product_count: int, embedding_count: int) -> Dict[str, Any]:
        """
        At startup:
        1. determine canonical product count
        2. determine embedding count
        3. determine FAISS count
        4. compare all three
        """
        faiss_count = self.index.ntotal if (HAS_FAISS and self.index) else len(self.id_map)
        is_matched = (canonical_product_count == embedding_count == faiss_count) and faiss_count > 0

        validation_result = {
            "canonical_product_count": canonical_product_count,
            "embedding_count": embedding_count,
            "faiss_vector_count": faiss_count,
            "dimension": self.dimension,
            "is_matched": is_matched,
            "status": "READY" if is_matched else "DEGRADED — VECTOR COUNT MISMATCH"
        }

        if not is_matched:
            logger.warning(
                f"FAISS VALIDATION MISMATCH: Products={canonical_product_count}, Embeddings={embedding_count}, FAISS={faiss_count}. "
                f"System will operate in degraded mode."
            )
            self.status = validation_result["status"]
        else:
            self.status = "READY"
            logger.info(f"FAISS index validated: {faiss_count:,} vectors exactly matched with catalog and embeddings.")

        return validation_result

    def search(self, query_vector: List[float], top_k: int = 20) -> List[Tuple[str, float]]:
        return self.top_k_search(query_vector, top_k)

    def top_k_search(self, query_vector: List[float], top_k: int = 20) -> List[Tuple[str, float]]:
        if not self.is_initialized or len(self.id_map) == 0:
            return []

        q_vec = np.array([query_vector], dtype=np.float32)
        if q_vec.shape[1] != self.dimension:
            logger.error(f"Query vector dimension {q_vec.shape[1]} does not match FAISS index {self.dimension}.")
            return []

        q_norm = np.linalg.norm(q_vec)
        if q_norm > 0:
            q_vec = q_vec / q_norm

        actual_k = min(top_k, len(self.id_map))

        if HAS_FAISS and self.index:
            distances, indices = self.index.search(q_vec, actual_k)
            dists_arr = distances[0]
            idxs_arr = indices[0]
        else:
            sims = np.dot(self.vectors, q_vec.T).flatten()
            idxs_arr = np.argsort(-sims)[:actual_k]
            dists_arr = sims[idxs_arr]

        results = []
        for dist, idx in zip(dists_arr, idxs_arr):
            if int(idx) in self.id_map:
                sku_id = self.id_map[int(idx)]
                results.append((sku_id, float(dist)))

        return results

    def rebuild(self, products: List[Dict[str, Any]], embeddings: List[List[float]], save_path: Optional[str] = None):
        self.reset()
        self.batch_insert(products, embeddings)
        if save_path:
            self.save(save_path)

    def batch_insert(self, products: List[Dict[str, Any]], embeddings: List[List[float]]):
        if not products or not embeddings:
            return
            
        vecs = np.array(embeddings, dtype=np.float32)
        norms = np.linalg.norm(vecs, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        vecs = vecs / norms

        start_idx = len(self.id_map)
        
        if HAS_FAISS:
            if not self.index:
                self.index = faiss.IndexFlatIP(self.dimension)
            self.index.add(vecs)
        else:
            if len(self.vectors) == 0:
                self.vectors = vecs
            else:
                self.vectors = np.vstack([self.vectors, vecs])
        
        for i, prod in enumerate(products):
            faiss_id = start_idx + i
            sku_id = str(prod["id"])
            self.id_map[faiss_id] = sku_id
            self.sku_to_int[sku_id] = faiss_id

        self.is_initialized = True
        self.status = "READY"
        logger.info(f"Vector index populated with {len(self.id_map):,} vectors (FAISS: {HAS_FAISS}).")

    def save(self, filepath: str):
        self.save_to_disk(filepath)

    def save_to_disk(self, filepath: str):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        meta_filepath = filepath + ".meta"
        if HAS_FAISS and self.index:
            faiss.write_index(self.index, filepath)
        else:
            with open(filepath, "wb") as f:
                pickle.dump(self.vectors, f)
                
        with open(meta_filepath, "wb") as f:
            pickle.dump({
                "id_map": self.id_map,
                "sku_to_int": self.sku_to_int,
                "dimension": self.dimension,
                "created_at": str(np.datetime64('now'))
            }, f)
        logger.info(f"Saved canonical vector index & metadata to {filepath}")

    def reset(self):
        if HAS_FAISS:
            self.index = faiss.IndexFlatIP(self.dimension)
        self.vectors = np.empty((0, self.dimension), dtype=np.float32)
        self.id_map.clear()
        self.sku_to_int.clear()
        self.is_initialized = False
        self.status = "NOT_INITIALIZED"

faiss_manager = FAISSIndexManager()
FaissIndexManager = FAISSIndexManager
