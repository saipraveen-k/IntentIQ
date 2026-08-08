import os
import time
import pickle
import random
import logging
import asyncio
import numpy as np
import pandas as pd
import torch
import faiss
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer, CrossEncoder
from mlxtend.frequent_patterns import apriori, association_rules
from sqlalchemy.ext.asyncio import AsyncSession

from models import SessionEncoder, UserTower, ProductTower, TwoTowerModel, MultiTaskNCF, device
from app.core.database import get_db, init_db
from app.auth import FirebaseAuthMiddleware
from app.routers.events import router as events_router, event_batch_worker
from app.routers.user import router as user_router


# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("intentiq_server")

app = FastAPI(title="IntentIQ Production recommendation & Discovery API")

# Enable CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enable Firebase Auth middleware
app.add_middleware(FirebaseAuthMiddleware)

# Include routers
app.include_router(events_router, prefix="/api/v1")
app.include_router(user_router, prefix="/api/v1")

# Global models and data structures
session_encoder = None
user_tower = None
product_tower = None
ncf_model = None
faiss_index = None

product_id_to_index = None
index_to_product_id = None
product_embeddings = None
mappings = None
product_details = {}
association_rules_dict = {}
product_popularity = {}
product_details_df = None

# Sentence Transformers for search reranking
embedding_model = None
cross_encoder = None

from typing import Optional

class FeedRequest(BaseModel):
    user_id: Optional[str] = None
    session_history: list[int]

class SearchRequest(BaseModel):
    query: str
    user_id: Optional[str] = None


class BundleRequest(BaseModel):
    product_id: int

# Helper to resolve files in Cwd, backend/, or backend/app/
def resolve_file(filename):
    prefixes = [
        "", 
        "app", 
        "backend", 
        os.path.join("backend", "app"), 
        "..", 
        os.path.join("..", "backend"),
        os.path.join("..", "backend", "app")
    ]
    for prefix in prefixes:
        path = os.path.join(prefix, filename) if prefix else filename
        if os.path.exists(path):
            logger.info(f"Resolved file: {filename} -> {path}")
            return path
    return filename

# Middleware to measure and print latency for every request
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000.0
    logger.info(f"Request: {request.method} {request.url.path} - Latency: {process_time:.2f}ms")
    response.headers["X-Process-Time-Ms"] = f"{process_time:.2f}"
    return response

# Dynamic explanation generation helper
def generate_reason(session_history: list[int], candidate_pid: int, details: dict) -> str:
    if not session_history:
        random.seed(candidate_pid)
        reasons = [
            "🔥 Trending in your area",
            "✨ Popular discovery pick",
            "🌟 Highly rated choice",
            "🎯 Match for your profile"
        ]
        return random.choice(reasons)
        
    cand_dept = details.get("department", "")
    cand_aisle = details.get("aisle", "")
    
    session_aisles = []
    session_depts = []
    for hist_pid in session_history:
        hist_details = product_details.get(hist_pid)
        if hist_details:
            session_aisles.append(hist_details.get("aisle", ""))
            session_depts.append(hist_details.get("department", ""))
            
    if cand_aisle in session_aisles:
        return f"Because you bought similar items in {cand_aisle}"
    if cand_dept in session_depts:
        return f"Because you shopped in {cand_dept} recently"
        
    for hist_pid in session_history:
        rules = association_rules_dict.get(hist_pid, [])
        if any(rule[0] == candidate_pid for rule in rules):
            return "✅ Frequently bought with your recent items"
            
    random.seed(candidate_pid)
    reasons = [
        "🔥 Trending in your area",
        "✨ Personalized just for you",
        "🌟 Highly recommended pick",
        "🎯 High match for your preferences"
    ]
    return random.choice(reasons)

@app.on_event("startup")
async def startup_event():
    # Start background task for event batch worker
    asyncio.create_task(event_batch_worker())

    # Initialize DB tables
    await init_db()

    global session_encoder, user_tower, product_tower, ncf_model, faiss_index
    global product_id_to_index, index_to_product_id, product_embeddings, mappings
    global product_details, association_rules_dict, embedding_model, cross_encoder

    logger.info("Initializing IntentIQ server dependencies...")

    # Load mappings
    mappings_path = resolve_file("data/processed/mappings.pkl")
    with open(mappings_path, "rb") as f:
        mappings = pickle.load(f)

    # Load FAISS index
    index_path = resolve_file("faiss_index.bin")
    faiss_index = faiss.read_index(index_path)
    logger.info(f"FAISS index loaded successfully with {faiss_index.ntotal} vectors.")

    # Load mapping of product ID to index
    dict_path = resolve_file("product_id_to_index.pkl")
    with open(dict_path, "rb") as f:
        product_id_to_index = pickle.load(f)
    
    # Load reverse mapping lists
    product_list_path = resolve_file("index_to_product_id.pkl")
    with open(product_list_path, "rb") as f:
        index_to_product_id = pickle.load(f)

    # Load product embeddings array
    product_embeddings = np.load(resolve_file("product_embeddings.npy")).astype('float32')

    # Load Instacart product catalog from processed metadata parquet
    logger.info("Loading processed product metadata Parquet...")
    metadata_path = resolve_file("data/processed/product_metadata.parquet")
    global product_details_df
    product_details_df = pd.read_parquet(metadata_path)
    
    for row in product_details_df.itertuples():
        product_details[row.product_id] = {
            "name": row.product_name,
            "department": row.department,
            "aisle": row.aisle,
            "department_id": row.department_id,
            "aisle_id": row.aisle_id
        }

    # Precompute product popularity index
    logger.info("Computing product popularity index...")
    try:
        instacart_dir = resolve_file("../datasets/instacart")
        if not os.path.exists(instacart_dir) or not os.path.exists(os.path.join(instacart_dir, "products.csv")):
            instacart_dir = resolve_file("datasets/instacart")
        prior_path = os.path.join(instacart_dir, "order_products__prior.csv")
        prior_pids = pd.read_csv(prior_path, usecols=['product_id'])['product_id'].value_counts()
        global product_popularity
        product_popularity = prior_pids.to_dict()
        logger.info(f"Loaded popularity index for {len(product_popularity)} products.")
    except Exception as e:
        logger.error(f"Error computing popularity: {e}")
        product_popularity = {}

    # Initialize and load model architectures (use original maximum sizes to match checkpoints)
    num_products = 49689
    num_users = 206210
    num_aisles = 135
    num_departments = 22

    session_encoder = SessionEncoder(num_products=num_products, embedding_dim=32, hidden_dim=64).to(device)
    user_tower = UserTower(num_users=num_users, user_emb_dim=32, session_dim=64, static_dim=8, output_dim=64).to(device)
    product_tower = ProductTower(num_products=num_products, num_aisles=num_aisles, num_departments=num_departments, prod_emb_dim=32, aisle_emb_dim=16, dept_emb_dim=16, text_dim=384, output_dim=64).to(device)
    
    two_tower = TwoTowerModel(user_tower, product_tower).to(device)

    # Load weights
    checkpoint = torch.load(resolve_file("two_tower.pth"), map_location=device)
    session_encoder.load_state_dict(checkpoint["session_encoder_state"])
    two_tower.load_state_dict(checkpoint["two_tower_state"])
    
    session_encoder.eval()
    two_tower.eval()
    logger.info("TwoTower model loaded and set to eval mode.")

    # Load MultiTaskNCF
    ncf_model = MultiTaskNCF(input_dim=193).to(device)
    ncf_path = resolve_file("multitask_ncf.pth")
    if os.path.exists(ncf_path):
        ncf_model.load_state_dict(torch.load(ncf_path, map_location=device))
    ncf_model.eval()
    logger.info("MultiTaskNCF model loaded and set to eval mode.")

    # Load local sentence-transformer models
    logger.info("Loading sentence transformer models...")
    embedding_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    cross_encoder = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
    logger.info("Sentence transformer models loaded successfully.")

    # Precompute association rules
    logger.info("Pre-computing association rules via apriori on prior orders...")
    try:
        prior_path = os.path.join(instacart_dir, "order_products__prior.csv")
        prior_df = pd.read_csv(prior_path, nrows=20000)
        basket = (prior_df.groupby(['order_id', 'product_id'])['add_to_cart_order']
                  .count().unstack().reset_index().fillna(0)
                  .set_index('order_id'))
        basket_sets = basket.map(lambda x: 1 if x > 0 else 0)
        
        frequent_itemsets = apriori(basket_sets, min_support=0.01, use_colnames=True)
        rules = association_rules(frequent_itemsets, metric="lift", min_threshold=1.0)
        
        for _, row in rules.iterrows():
            antecedent = int(list(row['antecedents'])[0])
            consequent = int(list(row['consequents'])[0])
            lift = float(row['lift'])
            if lift > 2.0:
                association_rules_dict.setdefault(antecedent, []).append((consequent, lift))
        
        for pid in association_rules_dict:
            association_rules_dict[pid] = sorted(association_rules_dict[pid], key=lambda x: x[1], reverse=True)[:5]
            
        logger.info(f"Association rules computed for {len(association_rules_dict)} products.")
    except Exception as e:
        logger.error(f"Error pre-computing association rules: {e}. Fallbacks will be used.")

def get_product_info(product_id: int) -> dict:
    details = product_details.get(product_id)
    if details:
        return {
            "name": details["name"],
            "department": details["department"],
            "aisle": details["aisle"]
        }
    return {
        "name": f"Product {product_id}",
        "department": "Grocery",
        "aisle": "Grocery"
    }

@app.post("/api/v1/recommendations/feed")
async def get_feed(req: FeedRequest, request: Request, db: AsyncSession = Depends(get_db)):
    t_start = time.time()
    user_raw = getattr(request.state, "uid", "mock-default-user")
    history_raw = req.session_history

    # Map user to idx (since Firebase UID is a string, it won't exist in user_to_idx, defaulting to index 1)
    u_idx = mappings["user_to_idx"].get(user_raw, 1)
    if u_idx >= 206210:
        u_idx = 1

    padded_history = np.zeros(20, dtype=np.int64)
    if history_raw:
        mapped_history = []
        for pid in history_raw:
            if pid < 49690:
                mapped_history.append(pid)
        history_len = len(mapped_history)
        if history_len > 0:
            padded_history[-min(20, history_len):] = mapped_history[-min(20, history_len):]

    history_t = torch.tensor([padded_history], dtype=torch.long, device=device)
    with torch.no_grad():
        sess_vec = session_encoder(history_t)

    # Seed must be integer
    if isinstance(user_raw, str):
        import hashlib
        seed_val = int(hashlib.md5(user_raw.encode("utf-8")).hexdigest(), 16) % (2**32 - 1)
    else:
        seed_val = int(user_raw) if user_raw else 1

    np.random.seed(seed_val)
    user_static_feats = torch.tensor([np.random.randn(8).astype(np.float32)], dtype=torch.float32, device=device)

    user_ids_t = torch.tensor([u_idx], dtype=torch.long, device=device)
    with torch.no_grad():
        user_emb = user_tower(user_ids_t, sess_vec, user_static_feats)
        user_emb_normalized = user_emb / torch.norm(user_emb, dim=-1, keepdim=True).clamp(min=1e-12)
        user_emb_arr = user_emb_normalized.cpu().numpy().astype('float32')

    distances, indices = faiss_index.search(user_emb_arr, 50)
    candidate_indices = indices[0]

    candidate_pids = []
    for idx in candidate_indices:
        if idx >= 0 and idx < len(index_to_product_id):
            candidate_pids.append(index_to_product_id[idx])

    cand_emb_list = []
    valid_pids = []
    for pid in candidate_pids:
        idx = product_id_to_index.get(pid)
        if idx is not None:
            cand_emb_list.append(product_embeddings[idx])
            valid_pids.append(pid)

    if not cand_emb_list:
        raise HTTPException(status_code=404, detail="No candidate products found in database.")

    cand_emb_arr = np.vstack(cand_emb_list)
    user_emb_rep = user_emb.repeat(len(valid_pids), 1)
    cand_emb_t = torch.tensor(cand_emb_arr, dtype=torch.float32, device=device)

    with torch.no_grad():
        click_prob, cart_prob, purchase_prob = ncf_model(user_emb_rep, cand_emb_t)
        ncf_scores = purchase_prob.squeeze(-1).cpu().numpy()

    candidates_with_scores = list(zip(valid_pids, ncf_scores))

    # ------------------ CTR BOOSTING ------------------
    from app.services.ctr import get_ctr_boost_factors
    boost_stats = await get_ctr_boost_factors(db, user_raw, product_details)
    boost_factors = boost_stats["boost_factors"]

    candidates_with_boosted_scores = []
    for pid, score in candidates_with_scores:
        details = product_details.get(pid, {})
        dept = details.get("department", "Grocery")
        boost = boost_factors.get(dept, 1.0)
        boosted_score = float(score) * boost
        candidates_with_boosted_scores.append((pid, boosted_score, boost))

    candidates_with_boosted_scores.sort(key=lambda x: x[1], reverse=True)
    # --------------------------------------------------

    final_recommendations = []
    dept_counts = {}

    for pid, score, boost in candidates_with_boosted_scores:
        details = product_details.get(pid)
        if not details:
            continue

        dept_id = details["department_id"]
        current_dept_count = dept_counts.get(dept_id, 0)

        if current_dept_count < 7:
            dept_counts[dept_id] = current_dept_count + 1

            reason = generate_reason(history_raw, int(pid), details)
            # Apply custom reason if highly boosted (boost > 1.02, which means CTR > 2% after Laplace smoothing)
            if boost > 1.02:
                reason = f"🎯 High click-through rate in {details['department']}"

            final_recommendations.append({
                "product_id": int(pid),
                "name": details["name"],
                "department": details["department"],
                "price": round(2.5 + (int(pid) % 13) * 0.95, 2),
                "reason": reason
            })

        if len(final_recommendations) >= 20:
            break

    if len(final_recommendations) < 20:
        for pid, score, boost in candidates_with_boosted_scores:
            if not any(r["product_id"] == pid for r in final_recommendations):
                details = product_details.get(pid)
                if details:
                    reason = generate_reason(history_raw, int(pid), details)
                    if boost > 1.02:
                        reason = f"🎯 High click-through rate in {details['department']}"

                    final_recommendations.append({
                        "product_id": int(pid),
                        "name": details["name"],
                        "department": details["department"],
                        "price": round(2.5 + (int(pid) % 13) * 0.95, 2),
                        "reason": reason
                    })
            if len(final_recommendations) >= 20:
                break

    latency_ms = (time.time() - t_start) * 1000.0
    logger.info(f"Feed calculated in {latency_ms:.2f}ms")
    return {"recommendations": final_recommendations}

KEYWORD_TO_DEPARTMENTS = {
    "fresh": ["produce", "dairy", "meat", "seafood"],
    "organic": ["produce", "dairy"],
    "protein": ["meat", "seafood", "eggs", "protein"],
    "snack": ["snacks", "bakery"],
    "fruit": ["produce"],
    "vegan": ["produce", "meat alternatives"],
    "gluten": ["bakery", "pantry"],
    "drink": ["beverages", "dairy"],
    "baby": ["baby", "babies"],
    "pet": ["pet", "pets"]
}

def query_intent_fallback(query: str, user_id: Optional[str] = None, limit: int = 20) -> list[int]:
    query_lower = query.lower()
    matched_targets = []
    for kw, depts in KEYWORD_TO_DEPARTMENTS.items():
        if kw in query_lower:
            matched_targets.extend(depts)
            
    candidate_pids = []
    
    if matched_targets:
        for pid in product_id_to_index.keys():
            details = product_details.get(pid)
            if details:
                dept_lower = details["department"].lower()
                if any(target in dept_lower for target in matched_targets):
                    candidate_pids.append(pid)
                    
    if not candidate_pids:
        candidate_pids = list(product_id_to_index.keys())
        
    candidate_pids.sort(key=lambda pid: product_popularity.get(pid, 0), reverse=True)
    return candidate_pids[:limit]

@app.post("/api/v1/search/semantic")
async def search_semantic(req: SearchRequest, request: Request):
    t_start = time.time()
    query = req.query
    user_raw = getattr(request.state, "uid", "mock-default-user")
    
    loop = asyncio.get_running_loop()
    query_text_emb = await loop.run_in_executor(
        None, 
        lambda: embedding_model.encode(query, convert_to_numpy=True)
    )
    
    query_text_emb_t = torch.tensor([query_text_emb], dtype=torch.float32, device=device)
    dummy_id = torch.tensor([0], dtype=torch.long, device=device)
    with torch.no_grad():
        query_vector_64_t = product_tower(dummy_id, dummy_id, dummy_id, query_text_emb_t)
        query_vector_64_t = query_vector_64_t / torch.norm(query_vector_64_t, dim=-1, keepdim=True).clamp(min=1e-12)
        query_vector_64 = query_vector_64_t.cpu().numpy().astype('float32')
        
    faiss_index.nprobe = 3
    distances, indices = faiss_index.search(query_vector_64, 50)
    candidate_indices = indices[0]
    
    candidate_pids = []
    for idx in candidate_indices:
        if idx >= 0 and idx < len(index_to_product_id):
            candidate_pids.append(index_to_product_id[idx])
            
    valid_pids = [pid for pid in candidate_pids if pid in product_id_to_index]
    
    is_fallback = False
    fallback_reason_str = ""
    
    if len(valid_pids) < 3 or query.lower().strip() in KEYWORD_TO_DEPARTMENTS:
        is_fallback = True
        valid_pids = query_intent_fallback(query, user_raw, limit=20)
        fallback_reason_str = f"Showing popular items in relevant aisles for '{query}'"
        
    def run_ncf_scoring():
        u_idx = mappings["user_to_idx"].get(user_raw, 1)
        if u_idx >= 206210:
            u_idx = 1
            
        if isinstance(user_raw, str):
            import hashlib
            seed_val = int(hashlib.md5(user_raw.encode("utf-8")).hexdigest(), 16) % (2**32 - 1)
        else:
            seed_val = int(user_raw) if user_raw else 1
            
        np.random.seed(seed_val)
        mock_static = torch.tensor([np.random.randn(8).astype(np.float32)], dtype=torch.float32, device=device)
        dummy_history = torch.zeros((1, 20), dtype=torch.long, device=device)
        with torch.no_grad():
            sess_vec = session_encoder(dummy_history)
            user_emb = user_tower(torch.tensor([u_idx], dtype=torch.long, device=device), sess_vec, mock_static)
            user_emb_rep = user_emb.repeat(len(valid_pids), 1)
            
        cand_emb_list = [product_embeddings[product_id_to_index[pid]] for pid in valid_pids]
        cand_emb_arr = np.vstack(cand_emb_list)
        cand_emb_t = torch.tensor(cand_emb_arr, dtype=torch.float32, device=device)
        with torch.no_grad():
            _, _, purchase_prob = ncf_model(user_emb_rep, cand_emb_t)
            ncf_scores = purchase_prob.squeeze(-1).cpu().numpy()
        return list(ncf_scores)
        
    cross_encoder_timeout = False
    
    if is_fallback:
        ncf_scores = await loop.run_in_executor(None, run_ncf_scoring)
        cross_scores = None
    else:
        query_word_count = len(query.split())
        ncf_task = loop.run_in_executor(None, run_ncf_scoring)
        
        if query_word_count > 3:
            pairs = [(query, product_details.get(pid, {}).get("name", "")) for pid in valid_pids]
            def run_cross_encoder_scoring():
                return cross_encoder.predict(pairs)
                
            cross_task = loop.run_in_executor(None, run_cross_encoder_scoring)
            
            try:
                ncf_scores, cross_scores = await asyncio.gather(
                    ncf_task,
                    asyncio.wait_for(cross_task, timeout=0.040)
                )
            except asyncio.TimeoutError:
                logger.warning(f"Cross-encoder timed out (> 40ms) for query '{query}'. Falling back to NCF only.")
                cross_encoder_timeout = True
                ncf_scores = await ncf_task
                cross_scores = None
            except Exception as e:
                logger.error(f"Error during parallel scoring: {e}")
                cross_encoder_timeout = True
                ncf_scores = await ncf_task
                cross_scores = None
        else:
            ncf_scores = await ncf_task
            cross_scores = None
            
    final_scored_results = []
    if cross_scores is not None and not cross_encoder_timeout:
        if len(cross_scores) > 1:
            c_min = cross_scores.min()
            c_max = cross_scores.max()
            norm_cross_scores = (cross_scores - c_min) / (c_max - c_min + 1e-12)
        else:
            norm_cross_scores = cross_scores
            
        for i, pid in enumerate(valid_pids):
            combined_score = 0.4 * float(norm_cross_scores[i]) + 0.6 * float(ncf_scores[i])
            final_scored_results.append((pid, combined_score))
    else:
        for i, pid in enumerate(valid_pids):
            final_scored_results.append((pid, float(ncf_scores[i])))
            
    final_scored_results.sort(key=lambda x: x[1], reverse=True)
    top_10 = final_scored_results[:10]
    
    results = []
    for pid, score in top_10:
        details = product_details.get(pid, {"name": f"Product {pid}", "department": "Grocery"})
        
        if is_fallback:
            reason_str = f"🔥 Popular in {details['department']}"
        else:
            reason_str = generate_reason([], int(pid), details)
            
        results.append({
            "product_id": int(pid),
            "name": details["name"],
            "department": details["department"],
            "price": round(2.5 + (int(pid) % 13) * 0.95, 2),
            "score": round(score, 4),
            "reason": reason_str
        })
        
    elapsed_ms = (time.time() - t_start) * 1000.0
    logger.info(f"Semantic search completed in {elapsed_ms:.2f}ms (timeout={cross_encoder_timeout}, fallback={is_fallback})")
    
    return {
        "results": results,
        "latency_ms": round(elapsed_ms, 2),
        "cross_encoder_timeout": cross_encoder_timeout,
        "fallback": is_fallback,
        "fallback_reason": fallback_reason_str
    }

@app.post("/api/v1/bundle")
def get_bundle(req: BundleRequest):
    pid = req.product_id
    rules = association_rules_dict.get(pid, [])
    
    bundle_items = []
    random.seed(pid)
    
    if len(rules) > 0:
        for item_pid, lift in rules:
            details = product_details.get(item_pid)
            if details:
                sim_price = round(random.uniform(2.5, 12.0), 2)
                bundle_items.append({
                    "product_id": int(item_pid),
                    "name": details["name"],
                    "price": sim_price,
                    "department": details["department"],
                    "reason": "Frequently bought together"
                })
    
    if len(bundle_items) < 5:
        base_details = product_details.get(pid)
        if base_details:
            aisle_id = base_details["aisle_id"]
            aisle_items = []
            if product_details_df is not None:
                aisle_items = product_details_df[product_details_df['aisle_id'] == aisle_id]['product_id'].tolist()
            
            for item_pid in aisle_items:
                if item_pid != pid and item_pid not in [b["product_id"] for b in bundle_items]:
                    details = product_details.get(item_pid)
                    if details:
                        sim_price = round(random.uniform(2.5, 12.0), 2)
                        bundle_items.append({
                            "product_id": int(item_pid),
                            "name": details["name"],
                            "price": sim_price,
                            "department": details["department"],
                            "reason": "Popular in this aisle"
                        })
                if len(bundle_items) >= 5:
                    break
                    
    base_price = round(random.uniform(3.0, 15.0), 2)
    original_total = base_price + sum(item["price"] for item in bundle_items)
    discounted_total = round(original_total * 0.85, 2)
    savings = round(original_total - discounted_total, 2)
    
    return {
        "base_product_id": int(pid),
        "bundle_items": bundle_items,
        "original_total": round(original_total, 2),
        "discounted_total": round(discounted_total, 2),
        "savings": savings
    }

@app.get("/api/v1/persona/{persona_name}")
def get_persona_history(persona_name: str):
    persona = persona_name.lower()
    keywords = []
    if persona == "healthy":
        keywords = ["organic", "fresh", "spinach", "apple", "banana", "yogurt", "chia"]
    elif persona == "student":
        keywords = ["ramen", "chips", "soda", "energy", "pizza", "noodle", "snack"]
    elif persona == "keto":
        keywords = ["cheese", "bacon", "butter", "egg", "beef", "avocado", "cream"]
    elif persona == "budget":
        keywords = ["rice", "pasta", "beans", "tuna", "bread", "macaroni"]
    elif persona == "family":
        keywords = ["cereal", "pack", "gallon", "milk", "wipes", "large"]
    else:
        keywords = ["organic", "fresh", "apple"]
        
    matching_pids = []
    for pid, details in product_details.items():
        name_lower = details["name"].lower()
        if any(kw in name_lower for kw in keywords):
            if pid in product_id_to_index:
                matching_pids.append(pid)
                if len(matching_pids) >= 10:
                    break
                
    if not matching_pids:
        matching_pids = list(product_id_to_index.keys())[:10]
        
    return {"persona": persona_name, "session_history": matching_pids}

@app.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "faiss_index_size": faiss_index.ntotal if faiss_index else 0,
        "model_device": str(device)
    }

# Mount static folder
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def read_index():
    return FileResponse("static/index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
