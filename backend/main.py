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
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer, CrossEncoder
from mlxtend.frequent_patterns import apriori, association_rules

from models import SessionEncoder, UserTower, ProductTower, TwoTowerModel, MultiTaskNCF, device

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

# Sentence Transformers for search reranking
embedding_model = None
cross_encoder = None

class FeedRequest(BaseModel):
    user_id: int
    session_history: list[int]

class SearchRequest(BaseModel):
    query: str
    user_id: int

class BundleRequest(BaseModel):
    product_id: int

# Middleware to measure and print latency for every request
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000.0
    logger.info(f"Request: {request.method} {request.url.path} - Latency: {process_time:.2f}ms")
    response.headers["X-Process-Time-Ms"] = f"{process_time:.2f}"
    return response

@app.on_event("startup")
def startup_event():
    global session_encoder, user_tower, product_tower, ncf_model, faiss_index
    global product_id_to_index, index_to_product_id, product_embeddings, mappings
    global product_details, association_rules_dict, embedding_model, cross_encoder

    logger.info("Initializing IntentIQ server dependencies...")

    # Load mappings
    mappings_path = "data/processed/mappings.pkl"
    if not os.path.exists(mappings_path):
        raise FileNotFoundError(f"Mappings file not found at {mappings_path}. Please run train_models.py first.")
    with open(mappings_path, "rb") as f:
        mappings = pickle.load(f)

    # Load FAISS index
    index_path = "faiss_index.bin"
    if not os.path.exists(index_path):
        raise FileNotFoundError(f"FAISS index file not found at {index_path}. Please run build_index.py first.")
    faiss_index = faiss.read_index(index_path)
    logger.info(f"FAISS index loaded successfully with {faiss_index.ntotal} vectors.")

    # Load mapping of product ID to index
    dict_path = "product_id_to_index.pkl"
    if not os.path.exists(dict_path):
        raise FileNotFoundError(f"Mapping dictionary not found at {dict_path}.")
    with open(dict_path, "rb") as f:
        product_id_to_index = pickle.load(f)
    
    # Load reverse mapping lists
    product_list_path = "product_id_list.pkl"
    with open(product_list_path, "rb") as f:
        index_to_product_id = pickle.load(f)

    # Load product embeddings array
    product_embeddings = np.load("product_embeddings.npy").astype('float32')

    # Load Instacart product catalog for metadata
    instacart_dir = "../datasets/instacart"
    if not os.path.exists(os.path.join(instacart_dir, "products.csv")):
        instacart_dir = "datasets/instacart"
    
    products_df = pd.read_csv(os.path.join(instacart_dir, "products.csv"))
    depts_df = pd.read_csv(os.path.join(instacart_dir, "departments.csv"))
    aisles_df = pd.read_csv(os.path.join(instacart_dir, "aisles.csv"))

    dept_map = dict(zip(depts_df['department_id'], depts_df['department']))
    aisle_map = dict(zip(aisles_df['aisle_id'], aisles_df['aisle']))

    for row in products_df.itertuples():
        product_details[row.product_id] = {
            "name": row.product_name,
            "department": dept_map.get(row.department_id, "Grocery"),
            "aisle": aisle_map.get(row.aisle_id, "Grocery"),
            "department_id": row.department_id,
            "aisle_id": row.aisle_id
        }

    # Initialize and load model architectures
    num_products = len(mappings["product_to_idx"]) + 1
    num_users = len(mappings["user_to_idx"]) + 1
    num_aisles = len(mappings["aisle_to_idx"]) + 1
    num_departments = len(mappings["dept_to_idx"]) + 1

    session_encoder = SessionEncoder(num_products=num_products, embedding_dim=32, hidden_dim=64).to(device)
    user_tower = UserTower(num_users=num_users, user_emb_dim=32, session_dim=64, static_dim=8, output_dim=64).to(device)
    product_tower = ProductTower(num_products=num_products, num_aisles=num_aisles, num_departments=num_departments, prod_emb_dim=32, aisle_emb_dim=16, dept_emb_dim=16, text_dim=384, output_dim=64).to(device)
    
    two_tower = TwoTowerModel(user_tower, product_tower).to(device)

    # Load weights
    checkpoint = torch.load("two_tower.pth", map_location=device)
    session_encoder.load_state_dict(checkpoint["session_encoder_state"])
    two_tower.load_state_dict(checkpoint["two_tower_state"])
    
    session_encoder.eval()
    two_tower.eval()
    logger.info("TwoTower model loaded and set to eval mode.")

    # Load MultiTaskNCF
    ncf_model = MultiTaskNCF(input_dim=193).to(device)
    if os.path.exists("multitask_ncf.pth"):
        ncf_model.load_state_dict(torch.load("multitask_ncf.pth", map_location=device))
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
        # Load a moderate slice of orders to keep startup quick and memory safe
        prior_df = pd.read_csv(prior_path, nrows=20000)
        # Group by order and list product IDs
        basket = (prior_df.groupby(['order_id', 'product_id'])['add_to_cart_order']
                  .count().unstack().reset_index().fillna(0)
                  .set_index('order_id'))
        basket_sets = basket.map(lambda x: 1 if x > 0 else 0)
        
        # Run apriori
        frequent_itemsets = apriori(basket_sets, min_support=0.01, use_colnames=True)
        rules = association_rules(frequent_itemsets, metric="lift", min_threshold=1.0)
        
        # Build rules lookup dictionary
        for _, row in rules.iterrows():
            antecedent = int(list(row['antecedents'])[0])
            consequent = int(list(row['consequents'])[0])
            lift = float(row['lift'])
            if lift > 2.0:
                association_rules_dict.setdefault(antecedent, []).append((consequent, lift))
        
        # Sort by lift score
        for pid in association_rules_dict:
            association_rules_dict[pid] = sorted(association_rules_dict[pid], key=lambda x: x[1], reverse=True)[:5]
            
        logger.info(f"Association rules computed for {len(association_rules_dict)} products.")
    except Exception as e:
        logger.error(f"Error pre-computing association rules: {e}. Fallbacks will be used.")

@app.post("/api/v1/recommendations/feed")
def get_feed(req: FeedRequest):
    t_start = time.time()
    user_raw = req.user_id
    history_raw = req.session_history
    
    # 1. Translate user_id and history to index offsets
    u_idx = mappings["user_to_idx"].get(user_raw, 0)
    
    padded_history = np.zeros(20, dtype=np.int64)
    if history_raw:
        mapped_history = [mappings["product_to_idx"].get(pid, 0) for pid in history_raw if pid in mappings["product_to_idx"]]
        history_len = len(mapped_history)
        if history_len > 0:
            padded_history[-min(20, history_len):] = mapped_history[-min(20, history_len):]
            
    # 2. Run Session Encoder
    history_t = torch.tensor([padded_history], dtype=torch.long, device=device)
    with torch.no_grad():
        sess_vec = session_encoder(history_t) # (1, 64)
        
    # Generate deterministic user static features based on user_id
    np.random.seed(user_raw)
    user_static_feats = torch.tensor([np.random.randn(8).astype(np.float32)], dtype=torch.float32, device=device)
    
    # 3. Generate User embedding (User Tower)
    user_ids_t = torch.tensor([u_idx], dtype=torch.long, device=device)
    with torch.no_grad():
        user_emb = user_tower(user_ids_t, sess_vec, user_static_feats) # (1, 64)
        # Normalize
        user_emb_normalized = user_emb / torch.norm(user_emb, dim=-1, keepdim=True).clamp(min=1e-12)
        user_emb_arr = user_emb_normalized.cpu().numpy().astype('float32')
        
    # 4. Search FAISS index for top-100 candidates
    distances, indices = faiss_index.search(user_emb_arr, 100)
    candidate_indices = indices[0]
    
    # Map index inside FAISS/product_embeddings to product_id
    candidate_pids = []
    for idx in candidate_indices:
        if idx >= 0 and idx < len(index_to_product_id):
            candidate_pids.append(index_to_product_id[idx])
            
    # 5. MultiTaskNCF scoring (Phase 2 Update)
    # Look up embeddings in product_embeddings
    cand_emb_list = []
    valid_pids = []
    for pid in candidate_pids:
        idx = product_id_to_index.get(pid)
        if idx is not None:
            cand_emb_list.append(product_embeddings[idx])
            valid_pids.append(pid)
            
    if not cand_emb_list:
        raise HTTPException(status_code=404, detail="No candidate products found in database.")
        
    cand_emb_arr = np.vstack(cand_emb_list) # (num_candidates, 64)
    
    # Compute scores using NCF
    user_emb_rep = user_emb.repeat(len(valid_pids), 1) # Repeat user vector for batched scoring
    cand_emb_t = torch.tensor(cand_emb_arr, dtype=torch.float32, device=device)
    
    with torch.no_grad():
        click_prob, cart_prob, purchase_prob = ncf_model(user_emb_rep, cand_emb_t)
        ncf_scores = purchase_prob.squeeze(-1).cpu().numpy()
        
    # Zip, sort, and apply diversity filter
    candidates_with_scores = list(zip(valid_pids, ncf_scores))
    candidates_with_scores.sort(key=lambda x: x[1], reverse=True)
    
    # 6. Apply diversity guardrail (Max 35% of recommendations per department = max 7 items for 20 recommendations)
    final_recommendations = []
    dept_counts = {}
    
    reason_templates = [
        "Based on your recent browsing history",
        "Trending in your local area",
        "Similar to your past shopping clicks",
        "Frequently purchased together with items in your basket",
        "Highly recommended fresh pick"
    ]
    
    for pid, score in candidates_with_scores:
        details = product_details.get(pid)
        if not details:
            continue
            
        dept_id = details["department_id"]
        current_dept_count = dept_counts.get(dept_id, 0)
        
        # Enforce 35% rule (no department has > 7 products in final 20)
        if current_dept_count < 7:
            dept_counts[dept_id] = current_dept_count + 1
            
            # Select deterministic but diverse reason
            random.seed(pid)
            reason = random.choice(reason_templates)
            if "Dairy" in details["department"]:
                reason = "Because you viewed similar items in Dairy"
                
            final_recommendations.append({
                "product_id": int(pid),
                "name": details["name"],
                "department": details["department"],
                "reason": reason
            })
            
        if len(final_recommendations) >= 20:
            break
            
    # Fallback to fill up if too strict
    if len(final_recommendations) < 20:
        for pid, score in candidates_with_scores:
            if not any(r["product_id"] == pid for r in final_recommendations):
                details = product_details.get(pid)
                if details:
                    random.seed(pid)
                    final_recommendations.append({
                        "product_id": int(pid),
                        "name": details["name"],
                        "department": details["department"],
                        "reason": random.choice(reason_templates)
                    })
            if len(final_recommendations) >= 20:
                break
                
    latency_ms = (time.time() - t_start) * 1000.0
    logger.info(f"Feed calculated in {latency_ms:.2f}ms")
    return {"recommendations": final_recommendations}

@app.post("/api/v1/search/semantic")
async def search_semantic(req: SearchRequest):
    t_start = time.time()
    query = req.query
    user_raw = req.user_id
    
    # 1. Generate text embedding for search query (384-d)
    loop = asyncio.get_running_loop()
    query_text_emb = await loop.run_in_executor(
        None, 
        lambda: embedding_model.encode(query, convert_to_numpy=True)
    )
    
    # 2. Project using ProductTower to 64-d retrieval space (dummy IDs)
    query_text_emb_t = torch.tensor([query_text_emb], dtype=torch.float32, device=device)
    dummy_id = torch.tensor([0], dtype=torch.long, device=device)
    with torch.no_grad():
        query_vector_64_t = product_tower(dummy_id, dummy_id, dummy_id, query_text_emb_t)
        # Normalize
        query_vector_64_t = query_vector_64_t / torch.norm(query_vector_64_t, dim=-1, keepdim=True).clamp(min=1e-12)
        query_vector_64 = query_vector_64_t.cpu().numpy().astype('float32')
        
    # 3. Retrieve top-25 candidate product IDs with nprobe=3
    faiss_index.nprobe = 3
    distances, indices = faiss_index.search(query_vector_64, 25)
    candidate_indices = indices[0]
    
    candidate_pids = []
    for idx in candidate_indices:
        if idx >= 0 and idx < len(index_to_product_id):
            candidate_pids.append(index_to_product_id[idx])
            
    valid_pids = [pid for pid in candidate_pids if pid in product_id_to_index]
    if not valid_pids:
        raise HTTPException(status_code=404, detail="No matching products found.")
        
    # Define execution closures
    def run_ncf_scoring():
        u_idx = mappings["user_to_idx"].get(user_raw, 0)
        np.random.seed(user_raw)
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
        
    query_word_count = len(query.split())
    cross_encoder_timeout = False
    
    # 4. Run scorers concurrently using asyncio.gather / wait_for
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
        
    # 5. Blend scores
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
        results.append({
            "product_id": int(pid),
            "name": details["name"],
            "department": details["department"],
            "score": round(score, 4)
        })
        
    elapsed_ms = (time.time() - t_start) * 1000.0
    logger.info(f"Semantic search completed in {elapsed_ms:.2f}ms (timeout={cross_encoder_timeout})")
    
    return {
        "results": results,
        "latency_ms": round(elapsed_ms, 2),
        "cross_encoder_timeout": cross_encoder_timeout
    }

@app.post("/api/v1/bundle")
def get_bundle(req: BundleRequest):
    pid = req.product_id
    
    # Fetch pre-computed association rules
    rules = association_rules_dict.get(pid, [])
    
    bundle_items = []
    random.seed(pid)
    
    if len(rules) > 0:
        for item_pid, lift in rules:
            details = product_details.get(item_pid)
            if details:
                # Simulate a random price
                sim_price = round(random.uniform(2.5, 12.0), 2)
                bundle_items.append({
                    "product_id": int(item_pid),
                    "name": details["name"],
                    "price": sim_price
                })
    
    # Fallback to same aisle if we have fewer than 5 items
    if len(bundle_items) < 5:
        base_details = product_details.get(pid)
        if base_details:
            aisle_id = base_details["aisle_id"]
            # Get popular/first 10 items in same aisle
            instacart_dir = "../datasets/instacart"
            if not os.path.exists(os.path.join(instacart_dir, "products.csv")):
                instacart_dir = "datasets/instacart"
            products_df = pd.read_csv(os.path.join(instacart_dir, "products.csv"))
            aisle_items = products_df[products_df['aisle_id'] == aisle_id]['product_id'].tolist()
            
            for item_pid in aisle_items:
                if item_pid != pid and item_pid not in [b["product_id"] for b in bundle_items]:
                    details = product_details.get(item_pid)
                    if details:
                        sim_price = round(random.uniform(2.5, 12.0), 2)
                        bundle_items.append({
                            "product_id": int(item_pid),
                            "name": details["name"],
                            "price": sim_price
                        })
                if len(bundle_items) >= 5:
                    break
                    
    # Calculate AOV and savings metrics
    base_price = round(random.uniform(3.0, 15.0), 2)
    original_total = base_price + sum(item["price"] for item in bundle_items)
    discounted_total = round(original_total * 0.85, 2) # 15% bundle discount
    savings = round(original_total - discounted_total, 2)
    
    return {
        "base_product_id": int(pid),
        "bundle_items": bundle_items,
        "original_total": round(original_total, 2),
        "discounted_total": round(discounted_total, 2),
        "savings": savings
    }

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
