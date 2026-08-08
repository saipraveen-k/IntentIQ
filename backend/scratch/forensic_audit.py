import os
import glob
import json
import pickle
import numpy as np
import pandas as pd
import torch
import faiss
import sqlite3

def run_audit():
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    print(f"=== INTENTIQ FORENSIC AUDIT ROOT: {repo_root} ===")
    
    report = {
        "raw_datasets": {},
        "processed_datasets": {},
        "embeddings": {},
        "faiss_indexes": {},
        "id_mappings": {},
        "pytorch_models": {},
        "sqlite_db": {},
        "inconsistencies": []
    }
    
    # 1. Audit Raw Instacart Datasets
    raw_dir = os.path.join(repo_root, "datasets", "instacart")
    if os.path.exists(raw_dir):
        for f in sorted(os.listdir(raw_dir)):
            fpath = os.path.join(raw_dir, f)
            size_mb = os.path.getsize(fpath) / (1024 * 1024)
            info = {"size_mb": round(size_mb, 2)}
            try:
                # Read head or sample
                if f in ["aisles.csv", "departments.csv", "products.csv"]:
                    df = pd.read_csv(fpath)
                    info["rows"] = len(df)
                    info["columns"] = list(df.columns)
                    if "product_id" in df.columns:
                        info["unique_product_ids"] = int(df["product_id"].nunique())
                    if "department_id" in df.columns:
                        info["unique_departments"] = int(df["department_id"].nunique())
                    if "aisle_id" in df.columns:
                        info["unique_aisles"] = int(df["aisle_id"].nunique())
                elif f == "orders.csv":
                    df = pd.read_csv(fpath, nrows=500000)
                    info["sample_rows_analyzed"] = len(df)
                    info["columns"] = list(df.columns)
                    info["eval_sets"] = df["eval_set"].value_counts().to_dict()
                elif "order_products" in f:
                    df = pd.read_csv(fpath, nrows=500000)
                    info["sample_rows_analyzed"] = len(df)
                    info["columns"] = list(df.columns)
                    info["unique_sample_products"] = int(df["product_id"].nunique())
            except Exception as e:
                info["error"] = str(e)
            report["raw_datasets"][f] = info
            
    # 2. Audit Processed Parquet Datasets
    proc_dir = os.path.join(repo_root, "backend", "data", "processed")
    if os.path.exists(proc_dir):
        for f in sorted(os.listdir(proc_dir)):
            fpath = os.path.join(proc_dir, f)
            size_mb = os.path.getsize(fpath) / (1024 * 1024)
            info = {"size_mb": round(size_mb, 2)}
            if f.endswith(".parquet"):
                try:
                    df = pd.read_parquet(fpath)
                    info["rows"] = len(df)
                    info["columns"] = list(df.columns)
                    info["null_counts"] = {k: int(v) for k, v in df.isnull().sum().items() if v > 0}
                    if "product_id" in df.columns:
                        info["unique_product_ids"] = int(df["product_id"].nunique())
                        info["min_product_id"] = int(df["product_id"].min())
                        info["max_product_id"] = int(df["product_id"].max())
                    if "user_id" in df.columns:
                        info["unique_user_ids"] = int(df["user_id"].nunique())
                except Exception as e:
                    info["error"] = str(e)
            elif f.endswith(".pkl"):
                try:
                    with open(fpath, "rb") as pkl_f:
                        obj = pickle.load(pkl_f)
                    info["type"] = str(type(obj))
                    if isinstance(obj, dict):
                        info["keys"] = list(obj.keys())
                        for k, v in obj.items():
                            if hasattr(v, "__len__"):
                                info[f"{k}_len"] = len(v)
                except Exception as e:
                    info["error"] = str(e)
            report["processed_datasets"][f] = info
            
    # 3. Audit Embeddings
    for emb_file in glob.glob(os.path.join(repo_root, "backend", "**", "*embedding*.npy"), recursive=True):
        rel = os.path.relpath(emb_file, repo_root)
        try:
            arr = np.load(emb_file)
            report["embeddings"][rel] = {
                "shape": list(arr.shape),
                "dtype": str(arr.dtype),
                "num_vectors": arr.shape[0],
                "dimension": arr.shape[1] if len(arr.shape) > 1 else 1,
                "has_nan": bool(np.isnan(arr).any()),
                "norms_sample": float(np.linalg.norm(arr[0])) if len(arr) > 0 else 0.0
            }
        except Exception as e:
            report["embeddings"][rel] = {"error": str(e)}
            
    # 4. Audit FAISS Indexes
    for faiss_file in glob.glob(os.path.join(repo_root, "backend", "**", "*faiss*.bin"), recursive=True):
        rel = os.path.relpath(faiss_file, repo_root)
        try:
            idx = faiss.read_index(faiss_file)
            report["faiss_indexes"][rel] = {
                "ntotal": int(idx.ntotal),
                "d": int(idx.d),
                "is_trained": bool(idx.is_trained),
                "metric_type": int(idx.metric_type)
            }
        except Exception as e:
            report["faiss_indexes"][rel] = {"error": str(e)}
            
    # 5. Audit PKL ID Mappings
    for pkl_file in glob.glob(os.path.join(repo_root, "backend", "**", "*.pkl"), recursive=True):
        rel = os.path.relpath(pkl_file, repo_root)
        try:
            with open(pkl_file, "rb") as pf:
                obj = pickle.load(pf)
            info = {"type": str(type(obj))}
            if isinstance(obj, dict):
                info["len"] = len(obj)
                sample_k = list(obj.keys())[:5]
                info["sample_keys"] = sample_k
                info["sample_vals"] = [obj[k] for k in sample_k]
            elif isinstance(obj, list):
                info["len"] = len(obj)
                info["sample"] = obj[:5]
            report["id_mappings"][rel] = info
        except Exception as e:
            report["id_mappings"][rel] = {"error": str(e)}
            
    # 6. Audit PyTorch Checkpoints
    for pth_file in glob.glob(os.path.join(repo_root, "backend", "**", "*.pth"), recursive=True):
        rel = os.path.relpath(pth_file, repo_root)
        try:
            ckpt = torch.load(pth_file, map_location="cpu")
            info = {"type": str(type(ckpt))}
            if isinstance(ckpt, dict):
                info["keys"] = list(ckpt.keys())
                param_shapes = {}
                for k, v in ckpt.items():
                    if hasattr(v, "shape"):
                        param_shapes[k] = list(v.shape)
                info["parameter_shapes"] = param_shapes
            report["pytorch_models"][rel] = info
        except Exception as e:
            report["pytorch_models"][rel] = {"error": str(e)}
            
    # 7. Audit SQLite DB
    db_path = os.path.join(repo_root, "backend", "intentiq.db")
    if os.path.exists(db_path):
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = [r[0] for r in cursor.fetchall()]
            report["sqlite_db"]["tables"] = {}
            for t in tables:
                cursor.execute(f"SELECT COUNT(*) FROM {t}")
                cnt = cursor.fetchone()[0]
                cursor.execute(f"PRAGMA table_info({t})")
                cols = [c[1] for c in cursor.fetchall()]
                report["sqlite_db"]["tables"][t] = {
                    "count": cnt,
                    "columns": cols
                }
            conn.close()
        except Exception as e:
            report["sqlite_db"]["error"] = str(e)
            
    # Save Report
    out_json = os.path.join(repo_root, "data_audit_report.json")
    with open(out_json, "w") as jf:
        json.dump(report, jf, indent=2)
    print(f"Report saved to {out_json}")
    return report

if __name__ == "__main__":
    rep = run_audit()
    print("\n--- AUDIT SUMMARY ---")
    print(json.dumps(rep, indent=2))
