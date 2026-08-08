import os
import sys
import pickle
import json
import sqlite3
import pandas as pd
import numpy as np
import torch
import faiss

def run_audit():
    results = {}
    print("============================================================")
    print("INTENTIQ COMPREHENSIVE DATA & ML PIPELINE AUDIT")
    print("============================================================")

    instacart_dir = "../datasets/instacart" if os.path.exists("../datasets/instacart") else "datasets/instacart"
    
    # 1. Instacart Raw CSVs
    print("\n--- 1. INSTACART RAW DATASETS ---")
    results["raw_instacart"] = {}
    csv_files = ["aisles.csv", "departments.csv", "products.csv", "orders.csv", "order_products__train.csv"]
    for fn in csv_files:
        fp = os.path.join(instacart_dir, fn)
        if os.path.exists(fp):
            df = pd.read_csv(fp)
            info = {
                "rows": int(len(df)),
                "columns": list(df.columns),
                "null_counts": {k: int(v) for k, v in df.isnull().sum().to_dict().items()},
                "size_bytes": os.path.getsize(fp)
            }
            if "product_id" in df.columns:
                info["unique_products"] = int(df["product_id"].nunique())
                info["min_product_id"] = int(df["product_id"].min())
                info["max_product_id"] = int(df["product_id"].max())
            if "user_id" in df.columns:
                info["unique_users"] = int(df["user_id"].nunique())
                info["min_user_id"] = int(df["user_id"].min())
                info["max_user_id"] = int(df["user_id"].max())
            if "order_id" in df.columns:
                info["unique_orders"] = int(df["order_id"].nunique())
            results["raw_instacart"][fn] = info
            print(f"{fn}: {info['rows']:,} rows, cols={info['columns']}, nulls={info['null_counts']}")
            if "unique_products" in info:
                print(f"  -> Unique products: {info['unique_products']:,} (range {info['min_product_id']}..{info['max_product_id']})")
            if "unique_users" in info:
                print(f"  -> Unique users: {info['unique_users']:,}")

    # Check prior CSV specifically
    prior_fp = os.path.join(instacart_dir, "order_products__prior.csv")
    if os.path.exists(prior_fp):
        prior_sz = os.path.getsize(prior_fp)
        # Sample first 100k rows to get column info and count lines
        print(f"order_products__prior.csv: size = {prior_sz:,} bytes ({round(prior_sz/(1024*1024), 2)} MB)")
        with open(prior_fp, 'rb') as f:
            prior_lines = sum(1 for _ in f) - 1
        results["raw_instacart"]["order_products__prior.csv"] = {
            "size_bytes": prior_sz,
            "rows": prior_lines,
            "columns": ["order_id", "product_id", "add_to_cart_order", "reordered"]
        }
        print(f"order_products__prior.csv total rows: {prior_lines:,}")

    # 2. Processed Files
    print("\n--- 2. PROCESSED ARTIFACTS ---")
    results["processed_artifacts"] = {}
    
    # Parquets
    for p_name in ["data/processed/product_metadata.parquet", "data/processed/clickstream.parquet", "data/processed/search_queries.parquet"]:
        if os.path.exists(p_name):
            df = pd.read_parquet(p_name)
            p_info = {
                "rows": int(len(df)),
                "columns": list(df.columns),
                "null_counts": {k: int(v) for k, v in df.isnull().sum().to_dict().items()},
                "size_bytes": os.path.getsize(p_name)
            }
            if "product_id" in df.columns:
                p_info["unique_products"] = int(df["product_id"].nunique())
                p_info["min_product_id"] = int(df["product_id"].min())
                p_info["max_product_id"] = int(df["product_id"].max())
            results["processed_artifacts"][p_name] = p_info
            print(f"{p_name}: {len(df):,} rows, cols={list(df.columns)}")
            if "unique_products" in p_info:
                print(f"  -> Unique products: {p_info['unique_products']:,}")

    # Numpy embeddings
    if os.path.exists("product_embeddings.npy"):
        emb = np.load("product_embeddings.npy")
        emb_info = {
            "shape": list(emb.shape),
            "dtype": str(emb.dtype),
            "size_bytes": os.path.getsize("product_embeddings.npy"),
            "norm_mean": float(np.mean(np.linalg.norm(emb, axis=1))),
            "has_nan": bool(np.isnan(emb).any())
        }
        results["processed_artifacts"]["product_embeddings.npy"] = emb_info
        print(f"product_embeddings.npy: shape={emb.shape}, norm_mean={emb_info['norm_mean']:.4f}, has_nan={emb_info['has_nan']}")

    # FAISS Indexes
    for f_name in ["faiss_index.bin", "app/faiss_index.bin"]:
        if os.path.exists(f_name):
            try:
                idx = faiss.read_index(f_name)
                f_info = {
                    "ntotal": int(idx.ntotal),
                    "dimension": int(idx.d),
                    "is_trained": bool(idx.is_trained),
                    "size_bytes": os.path.getsize(f_name)
                }
                results["processed_artifacts"][f_name] = f_info
                print(f"{f_name}: ntotal={idx.ntotal:,} vectors, d={idx.d}, trained={idx.is_trained}")
            except Exception as e:
                print(f"{f_name}: ERROR reading faiss index: {e}")

    # Pickles
    for pkl_name in ["product_id_to_index.pkl", "index_to_product_id.pkl", "product_id_list.pkl", "data/processed/mappings.pkl", "app/faiss_index.bin.meta"]:
        if os.path.exists(pkl_name):
            with open(pkl_name, "rb") as f:
                obj = pickle.load(f)
                if isinstance(obj, dict):
                    print(f"{pkl_name}: dict with {len(obj):,} keys")
                    results["processed_artifacts"][pkl_name] = {"type": "dict", "length": len(obj)}
                    if pkl_name == "data/processed/mappings.pkl":
                        for subk, subv in obj.items():
                            print(f"   mapping['{subk}']: len={len(subv):,}")
                            results["processed_artifacts"][f"mappings.{subk}"] = len(subv)
                elif isinstance(obj, list):
                    print(f"{pkl_name}: list with {len(obj):,} items (min={min(obj)}, max={max(obj)})")
                    results["processed_artifacts"][pkl_name] = {"type": "list", "length": len(obj), "min": int(min(obj)), "max": int(max(obj))}

    # 3. Model weights
    print("\n--- 3. PYTORCH MODEL CHECKPOINTS ---")
    results["model_checkpoints"] = {}
    if os.path.exists("two_tower.pth"):
        ckpt = torch.load("two_tower.pth", map_location="cpu")
        print(f"two_tower.pth: size = {os.path.getsize('two_tower.pth'):,} bytes")
        ckpt_info = {"keys": list(ckpt.keys())}
        if "session_encoder_state" in ckpt:
            ses = ckpt["session_encoder_state"]
            ckpt_info["session_encoder_emb_shape"] = list(ses["embedding.weight"].shape)
            print(f"  session_encoder embedding.weight: {ses['embedding.weight'].shape}")
        if "two_tower_state" in ckpt:
            tts = ckpt["two_tower_state"]
            ckpt_info["user_tower_user_emb_shape"] = list(tts["user_tower.user_embedding.weight"].shape)
            ckpt_info["product_tower_prod_emb_shape"] = list(tts["product_tower.product_embedding.weight"].shape)
            ckpt_info["product_tower_aisle_emb_shape"] = list(tts["product_tower.aisle_embedding.weight"].shape)
            ckpt_info["product_tower_dept_emb_shape"] = list(tts["product_tower.dept_embedding.weight"].shape)
            print(f"  user_tower.user_embedding.weight: {tts['user_tower.user_embedding.weight'].shape}")
            print(f"  product_tower.product_embedding.weight: {tts['product_tower.product_embedding.weight'].shape}")
            print(f"  product_tower.aisle_embedding.weight: {tts['product_tower.aisle_embedding.weight'].shape}")
            print(f"  product_tower.dept_embedding.weight: {tts['product_tower.dept_embedding.weight'].shape}")
        results["model_checkpoints"]["two_tower.pth"] = ckpt_info

    if os.path.exists("multitask_ncf.pth"):
        ckpt_ncf = torch.load("multitask_ncf.pth", map_location="cpu")
        print(f"multitask_ncf.pth: size = {os.path.getsize('multitask_ncf.pth'):,} bytes")
        ncf_info = {}
        for k, v in ckpt_ncf.items():
            ncf_info[k] = list(v.shape)
            print(f"  {k}: shape = {v.shape}")
        results["model_checkpoints"]["multitask_ncf.pth"] = ncf_info

    # 4. Database tables
    print("\n--- 4. SQLITE DATABASE TABLES ---")
    results["database"] = {}
    if os.path.exists("intentiq.db"):
        conn = sqlite3.connect("intentiq.db")
        cur = conn.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [r[0] for r in cur.fetchall()]
        print(f"intentiq.db tables: {tables}")
        for t in tables:
            cur.execute(f"SELECT count(*) FROM {t}")
            cnt = cur.fetchone()[0]
            print(f"  table '{t}': {cnt:,} rows")
            results["database"][t] = cnt
            if t == "products" and cnt > 0:
                cur.execute("SELECT id, title, category, price FROM products LIMIT 3")
                sample = cur.fetchall()
                print(f"    sample products: {sample}")

    # 5. Catalog Seeds
    print("\n--- 5. SEED CATALOGS ---")
    for s_name in ["app/seeds/catalog.json", "app/seeds/catalog_100.json", "app/seeds/catalog_full.json"]:
        if os.path.exists(s_name):
            with open(s_name, "r", encoding="utf-8") as f:
                cat_data = json.load(f)
                print(f"{s_name}: {len(cat_data):,} records")
                results["processed_artifacts"][s_name] = len(cat_data)

    # 6. Association rules trace
    print("\n--- 6. ASSOCIATION RULES DEEP TRACE ---")
    try:
        prior_sample_fp = os.path.join(instacart_dir, "order_products__prior.csv")
        sample_rows = 20000
        df_sample = pd.read_csv(prior_sample_fp, nrows=sample_rows)
        print(f"Read sample {sample_rows:,} rows from order_products__prior.csv")
        print(f"  Unique orders in sample: {df_sample['order_id'].nunique():,}")
        print(f"  Unique products in sample: {df_sample['product_id'].nunique():,}")
        
        # Check order sizes
        order_sizes = df_sample.groupby('order_id').size()
        print(f"  Order size distribution in 20k rows: min={order_sizes.min()}, median={order_sizes.median()}, max={order_sizes.max()}")
        
        # Test apriori at various min_supports
        from mlxtend.frequent_patterns import apriori, association_rules
        basket = (df_sample.groupby(['order_id', 'product_id'])['add_to_cart_order']
                  .count().unstack().reset_index().fillna(0)
                  .set_index('order_id'))
        basket_sets = (basket > 0).astype(bool)
        print(f"  Basket matrix shape: {basket_sets.shape}")
        
        for ms in [0.01, 0.005, 0.002, 0.001]:
            fsets = apriori(basket_sets, min_support=ms, use_colnames=True)
            print(f"  min_support={ms}: frequent itemsets count = {len(fsets)}")
            if len(fsets) > 0:
                rules = association_rules(fsets, metric="lift", min_threshold=1.0)
                print(f"    -> association rules count = {len(rules)}")
    except Exception as e:
        print(f"Error tracing association rules: {e}")

    # Save machine-readable audit report
    with open("data_audit_report.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print("\nMachine-readable audit report saved to data_audit_report.json")

if __name__ == "__main__":
    run_audit()
