import os
import pickle
import numpy as np
import pandas as pd
import torch
import torch.nn as nn

def preprocess():
    processed_dir = "data/processed"
    os.makedirs(processed_dir, exist_ok=True)
    clickstream_path = os.path.join(processed_dir, "clickstream.parquet")
    metadata_path = os.path.join(processed_dir, "product_metadata.parquet")
    queries_path = os.path.join(processed_dir, "search_queries.parquet")
    mappings_path = os.path.join(processed_dir, "mappings.pkl")
    
    instacart_dir = "../datasets/instacart"
    if not os.path.exists(os.path.join(instacart_dir, "products.csv")):
        instacart_dir = "datasets/instacart"
        
    print("Loading raw Instacart datasets...")
    products = pd.read_csv(os.path.join(instacart_dir, "products.csv"))
    orders = pd.read_csv(os.path.join(instacart_dir, "orders.csv"))
    aisles = pd.read_csv(os.path.join(instacart_dir, "aisles.csv"))
    departments = pd.read_csv(os.path.join(instacart_dir, "departments.csv"))
    prior_path = os.path.join(instacart_dir, "order_products__prior.csv")
    
    print("Loading prior order products (fully to find top-5000 products)...")
    prior = pd.read_csv(prior_path)
    
    print("Filtering to top 5,000 most purchased products...")
    top_products = prior['product_id'].value_counts().head(5000).index.tolist()
    
    # Merge products with aisles and departments to obtain string names
    products_merged = products.merge(aisles, on='aisle_id').merge(departments, on='department_id')
    products_filtered = products_merged[products_merged['product_id'].isin(top_products)].copy()
    
    # Save product metadata parquet
    product_metadata = products_filtered[['product_id', 'product_name', 'aisle_id', 'department_id', 'aisle', 'department']]
    product_metadata.to_parquet(metadata_path, index=False)
    print(f"Saved product metadata to {metadata_path}")
    
    # Filter prior to only include top products
    prior_filtered = prior[prior['product_id'].isin(top_products)]
    
    # Get unique orders containing these products
    unique_orders = prior_filtered['order_id'].unique()
    print(f"Found {len(unique_orders)} orders containing top-5000 products.")
    
    # Sample at least 100,000 orders
    np.random.seed(42)
    sample_size = min(100000, len(unique_orders))
    print(f"Sampling {sample_size} unique orders...")
    sampled_orders = np.random.choice(unique_orders, sample_size, replace=False)
    
    prior_sampled = prior_filtered[prior_filtered['order_id'].isin(sampled_orders)]
    
    # Merge with orders to get user_id
    prior_merged = prior_sampled.merge(orders[['order_id', 'user_id']], on='order_id', how='inner')
    
    # Build unique ID mappings (preserve original indices to avoid size mismatches with pretrained weights)
    print("Building mappings index...")
    unique_prods = products_filtered['product_id'].unique()
    product_to_idx = {int(pid): int(pid) for pid in unique_prods}
    
    unique_users = prior_merged['user_id'].unique()
    user_to_idx = {int(uid): int(uid) for uid in unique_users}
    
    unique_aisles = products_filtered['aisle_id'].unique()
    aisle_to_idx = {int(aid): int(aid) for aid in unique_aisles}
    
    unique_depts = products_filtered['department_id'].unique()
    dept_to_idx = {int(did): int(did) for did in unique_depts}
    
    mappings = {
        "product_to_idx": product_to_idx,
        "user_to_idx": user_to_idx,
        "aisle_to_idx": aisle_to_idx,
        "dept_to_idx": dept_to_idx
    }
    
    with open(mappings_path, "wb") as f:
        pickle.dump(mappings, f)
        
    print("Simulating clickstream events (views, clicks, carts)...")
    clicks_df = prior_merged[['order_id', 'product_id']].copy()
    clicks_df['event_type'] = 'click'
    
    # Simulating views (30% of clicks mapped to a related product in the same aisle)
    views_df = clicks_df.sample(frac=0.3, random_state=42).copy()
    views_df['event_type'] = 'view'
    
    prod_to_aisle = dict(zip(products_filtered['product_id'], products_filtered['aisle_id']))
    aisle_to_prods = products_filtered.groupby('aisle_id')['product_id'].apply(list).to_dict()
    
    random_aisle_product = {}
    for pid in products_filtered['product_id']:
        aisle_id = prod_to_aisle.get(pid, 1)
        candidates = aisle_to_prods.get(aisle_id, [pid])
        random_aisle_product[pid] = np.random.choice(candidates)
        
    views_df['product_id'] = views_df['product_id'].map(random_aisle_product)
    
    # Simulating cart events (50% of clicks)
    carts_df = clicks_df.sample(frac=0.5, random_state=42).copy()
    carts_df['event_type'] = 'cart'
    
    df_clickstream = pd.concat([clicks_df, views_df, carts_df]).sort_values(by='order_id').reset_index(drop=True)
    
    # Add simulated timestamp
    np.random.seed(42)
    base_ts = pd.Timestamp('2026-08-08 00:00:00')
    df_clickstream['timestamp'] = base_ts + pd.to_timedelta(np.random.randint(0, 86400, size=len(df_clickstream)), unit='s')
    
    # Keep requested columns
    df_clickstream = df_clickstream[['order_id', 'product_id', 'event_type', 'timestamp']]
    df_clickstream.to_parquet(clickstream_path, index=False)
    print(f"Generated {len(df_clickstream)} clickstream events saved to {clickstream_path}")
    
    # Simulating search queries
    print("Simulating search queries from product names...")
    queries_list = []
    grouped_clicks = clicks_df.groupby('order_id')
    for order_id, group in grouped_clicks:
        clicked_pids = group['product_id'].tolist()
        trigger_pid = clicked_pids[0]
        trigger_name = products_filtered[products_filtered['product_id'] == trigger_pid]['product_name'].values[0]
        query = " ".join(trigger_name.lower().split()[:3])
        queries_list.append({
            "order_id": int(order_id),
            "query": query,
            "product_ids_clicked": clicked_pids
        })
    df_queries = pd.DataFrame(queries_list)
    df_queries.to_parquet(queries_path, index=False)
    print(f"Generated {len(df_queries)} search queries saved to {queries_path}")

    # Load ProductTower models to compile embeddings
    print("Generating product embeddings for the 5000 products...")
    from models import ProductTower, device
    from sentence_transformers import SentenceTransformer
            
    product_tower = ProductTower(
        num_products=49689,
        num_aisles=135,
        num_departments=22,
        prod_emb_dim=32,
        aisle_emb_dim=16,
        dept_emb_dim=16,
        text_dim=384,
        output_dim=64
    ).to(device)
    
    if os.path.exists("two_tower.pth"):
        try:
            checkpoint = torch.load("two_tower.pth", map_location=device)
            state_dict = {}
            for k, v in checkpoint["two_tower_state"].items():
                if k.startswith("product_tower."):
                    state_dict[k.replace("product_tower.", "")] = v
            product_tower.load_state_dict(state_dict)
            print("Loaded trained ProductTower weights.")
        except Exception as e:
            print(f"Error loading ProductTower weights: {e}. Using random tower.")
            
    product_tower.eval()
    
    print("Loading SentenceTransformer model for name encodings...")
    embedding_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    product_names = products_filtered['product_name'].tolist()
    text_embs = embedding_model.encode(product_names, convert_to_numpy=True, show_progress_bar=True)
    
    embeddings_list = []
    product_id_list = products_filtered['product_id'].tolist()
    
    for i in range(len(product_id_list)):
        pid = product_id_list[i]
        aisle_id = prod_to_aisle.get(pid, 1)
        dept_id = products_filtered[products_filtered['product_id'] == pid]['department_id'].values[0]
        
        a_idx = int(aisle_id) if int(aisle_id) < 135 else 1
        d_idx = int(dept_id) if int(dept_id) < 22 else 1
        t_emb = text_embs[i]
        
        with torch.no_grad():
            pid_t = torch.tensor([int(pid)], dtype=torch.long, device=device)
            a_idx_t = torch.tensor([a_idx], dtype=torch.long, device=device)
            d_idx_t = torch.tensor([d_idx], dtype=torch.long, device=device)
            t_emb_t = torch.tensor([t_emb], dtype=torch.float32, device=device)
            
            emb = product_tower(pid_t, a_idx_t, d_idx_t, t_emb_t)
            embeddings_list.append(emb.cpu().numpy()[0])
            
    embeddings_arr = np.vstack(embeddings_list)
    np.save("product_embeddings.npy", embeddings_arr)
    with open("product_id_list.pkl", "wb") as f:
        pickle.dump(product_id_list, f)
        
    print("Pre-processing complete. All assets compiled successfully.")
    print(f"Product embeddings saved: shape {embeddings_arr.shape}")

if __name__ == "__main__":
    preprocess()
