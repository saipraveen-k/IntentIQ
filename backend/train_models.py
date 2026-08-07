import os
import pickle
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from models import SessionEncoder, UserTower, ProductTower, TwoTowerModel, device

# 1. Preprocess & generate parquet if needed
def prepare_data_if_needed():
    processed_dir = "data/processed"
    os.makedirs(processed_dir, exist_ok=True)
    clickstream_path = os.path.join(processed_dir, "clickstream.parquet")
    metadata_path = os.path.join(processed_dir, "product_metadata.parquet")
    mappings_path = os.path.join(processed_dir, "mappings.pkl")
    
    if os.path.exists(clickstream_path) and os.path.exists(metadata_path) and os.path.exists(mappings_path):
        print("Processed data and mappings already exist. Skipping preprocessing.")
        with open(mappings_path, "rb") as f:
            return pickle.load(f)

    print("Pre-processing Instacart dataset and generating synthetic clickstream/metadata...")
    instacart_dir = "../datasets/instacart"
    if not os.path.exists(os.path.join(instacart_dir, "products.csv")):
        instacart_dir = "datasets/instacart" # alternate path
        
    # Read products, aisles, depts
    products = pd.read_csv(os.path.join(instacart_dir, "products.csv"))
    orders = pd.read_csv(os.path.join(instacart_dir, "orders.csv"))
    prior = pd.read_csv(os.path.join(instacart_dir, "order_products__prior.csv"), nrows=300000) # Load subset for fast training
    
    # Save product metadata parquet
    product_metadata = products[['product_id', 'aisle_id', 'department_id']]
    product_metadata.to_parquet(metadata_path, index=False)
    
    # Build unique ID mappings (1-indexed, 0 is padding)
    unique_prods = products['product_id'].unique()
    product_to_idx = {int(pid): idx + 1 for idx, pid in enumerate(unique_prods)}
    
    unique_users = orders['user_id'].unique()
    user_to_idx = {int(uid): idx + 1 for idx, uid in enumerate(unique_users)}
    
    unique_aisles = products['aisle_id'].unique()
    aisle_to_idx = {int(aid): idx + 1 for idx, aid in enumerate(unique_aisles)}
    
    unique_depts = products['department_id'].unique()
    dept_to_idx = {int(did): idx + 1 for idx, did in enumerate(unique_depts)}
    
    mappings = {
        "product_to_idx": product_to_idx,
        "user_to_idx": user_to_idx,
        "aisle_to_idx": aisle_to_idx,
        "dept_to_idx": dept_to_idx
    }
    
    with open(mappings_path, "wb") as f:
        pickle.dump(mappings, f)
        
    # Generate clickstream
    print("Simulating clickstream events...")
    # Join prior order products with orders to get user_id
    prior_merged = prior.merge(orders[['order_id', 'user_id']], on='order_id', how='inner')
    
    prod_to_aisle = dict(zip(products['product_id'], products['aisle_id']))
    aisle_to_prods = products.groupby('aisle_id')['product_id'].apply(list).to_dict()
    
    clickstream_rows = []
    unique_orders = prior_merged['order_id'].unique()
    sampled_orders = unique_orders[:8000] # Use 8000 orders for robust session sequence
    
    np.random.seed(42)
    for order_id in sampled_orders:
        order_df = prior_merged[prior_merged['order_id'] == order_id]
        order_prods = order_df['product_id'].tolist()
        user_id = int(order_df['user_id'].iloc[0])
        
        # Simulate browsing timeline
        for pid in order_prods:
            aisle_id = prod_to_aisle.get(pid, 1)
            # 30% chance user viewed something else in same aisle but didn't buy
            if np.random.rand() < 0.3:
                candidates = aisle_to_prods.get(aisle_id, [pid])
                view_pid = np.random.choice(candidates)
                clickstream_rows.append((order_id, user_id, int(view_pid), 'view'))
                
            # Click event (70% probability)
            if np.random.rand() < 0.7:
                clickstream_rows.append((order_id, user_id, int(pid), 'click'))
            else:
                clickstream_rows.append((order_id, user_id, int(pid), 'view'))
                
    df_clickstream = pd.DataFrame(clickstream_rows, columns=['order_id', 'user_id', 'product_id', 'event_type'])
    df_clickstream.to_parquet(clickstream_path, index=False)
    print(f"Pre-processing complete. Saved parquet data to {processed_dir}")
    return mappings

# 2. Dataset implementation
class SessionDataset(Dataset):
    def __init__(self, clickstream_path, metadata_path, mappings):
        self.df_clickstream = pd.read_parquet(clickstream_path)
        self.df_metadata = pd.read_parquet(metadata_path)
        
        self.product_to_idx = mappings["product_to_idx"]
        self.user_to_idx = mappings["user_to_idx"]
        self.aisle_to_idx = mappings["aisle_to_idx"]
        self.dept_to_idx = mappings["dept_to_idx"]
        
        # Build product details mapping
        self.prod_details = {}
        for row in self.df_metadata.itertuples():
            p_idx = self.product_to_idx.get(row.product_id, 0)
            a_idx = self.aisle_to_idx.get(row.aisle_id, 0)
            d_idx = self.dept_to_idx.get(row.department_id, 0)
            self.prod_details[p_idx] = (a_idx, d_idx)
            
        self.aisle_to_prod_indices = {}
        for row in self.df_metadata.itertuples():
            p_idx = self.product_to_idx.get(row.product_id, 0)
            a_idx = self.aisle_to_idx.get(row.aisle_id, 0)
            if p_idx > 0 and a_idx > 0:
                self.aisle_to_prod_indices.setdefault(a_idx, []).append(p_idx)
                
        # Generate user static demographic features (8 dims, deterministic based on user_id seed)
        np.random.seed(1337)
        num_users = len(self.user_to_idx) + 2
        self.user_static = np.random.randn(num_users, 8).astype(np.float32)
        
        # Group clickstream events by session (order_id)
        self.samples = []
        grouped = self.df_clickstream.groupby('order_id')
        for order_id, group in grouped:
            user_raw = int(group['user_id'].iloc[0])
            u_idx = self.user_to_idx.get(user_raw, 0)
            
            # Sequence of clicked product indices
            clicks = [self.product_to_idx.get(row.product_id, 0) for row in group.itertuples() if row.event_type == 'click' and row.product_id in self.product_to_idx]
            
            # Build samples sequentially
            for i in range(len(clicks)):
                pos_prod = clicks[i]
                history = clicks[:i][-20:] # max length 20
                if len(history) == 0:
                    history = [0] # padding
                
                # Fetch aisle details to sample hard negatives from same aisle
                aisle_idx, dept_idx = self.prod_details.get(pos_prod, (1, 1))
                
                # Sample 5 hard negatives from the same aisle that were not clicked in this session
                aisle_candidates = self.aisle_to_prod_indices.get(aisle_idx, [pos_prod])
                non_clicked_candidates = [p for p in aisle_candidates if p not in clicks]
                
                if len(non_clicked_candidates) >= 5:
                    hard_negs = np.random.choice(non_clicked_candidates, 5, replace=False)
                else:
                    # Fallback with replacement or random items
                    all_candidates = list(self.product_to_idx.values())
                    hard_negs = np.random.choice(non_clicked_candidates + all_candidates, 5, replace=True)
                    
                self.samples.append({
                    "user_id": u_idx,
                    "session_history": history,
                    "pos_product_id": pos_prod,
                    "pos_aisle_id": aisle_idx,
                    "pos_dept_id": dept_idx,
                    "hard_negatives": list(hard_negs)
                })

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        sample = self.samples[idx]
        
        # Pad session history to length 20
        history = sample["session_history"]
        padded_history = np.zeros(20, dtype=np.int64)
        padded_history[-len(history):] = history
        
        # Fetch details for hard negatives
        neg_aisles = []
        neg_depts = []
        for neg_pid in sample["hard_negatives"]:
            a, d = self.prod_details.get(neg_pid, (1, 1))
            neg_aisles.append(a)
            neg_depts.append(d)
            
        return {
            "user_id": torch.tensor(sample["user_id"], dtype=torch.long),
            "session_history": torch.tensor(padded_history, dtype=torch.long),
            "user_static": torch.tensor(self.user_static[sample["user_id"]], dtype=torch.float32),
            "pos_product_id": torch.tensor(sample["pos_product_id"], dtype=torch.long),
            "pos_aisle_id": torch.tensor(sample["pos_aisle_id"], dtype=torch.long),
            "pos_dept_id": torch.tensor(sample["pos_dept_id"], dtype=torch.long),
            "hard_negatives": torch.tensor(sample["hard_negatives"], dtype=torch.long),
            "neg_aisle_ids": torch.tensor(neg_aisles, dtype=torch.long),
            "neg_dept_ids": torch.tensor(neg_depts, dtype=torch.long)
        }

def train_and_evaluate():
    mappings = prepare_data_if_needed()
    
    clickstream_path = "data/processed/clickstream.parquet"
    metadata_path = "data/processed/product_metadata.parquet"
    
    # Instantiate dataset and loader
    dataset = SessionDataset(clickstream_path, metadata_path, mappings)
    
    # Split train and validation (80/20)
    train_size = int(0.8 * len(dataset))
    val_size = len(dataset) - train_size
    train_dataset, val_dataset = torch.utils.data.random_split(dataset, [train_size, val_size])
    
    train_loader = DataLoader(train_dataset, batch_size=256, shuffle=True, drop_last=True)
    val_loader = DataLoader(val_dataset, batch_size=256, shuffle=False)
    
    # Vocabulary sizes
    num_products = len(mappings["product_to_idx"]) + 1
    num_users = len(mappings["user_to_idx"]) + 1
    num_aisles = len(mappings["aisle_to_idx"]) + 1
    num_departments = len(mappings["dept_to_idx"]) + 1
    
    # Initialize models
    session_encoder = SessionEncoder(num_products=num_products, embedding_dim=32, hidden_dim=64).to(device)
    user_tower = UserTower(num_users=num_users, user_emb_dim=32, session_dim=64, static_dim=8, output_dim=64).to(device)
    product_tower = ProductTower(num_products=num_products, num_aisles=num_aisles, num_departments=num_departments, prod_emb_dim=32, aisle_emb_dim=16, dept_emb_dim=16, text_dim=384, output_dim=64).to(device)
    
    two_tower = TwoTowerModel(user_tower, product_tower).to(device)
    
    # Use Adam optimizer
    optimizer = torch.optim.Adam(
        list(session_encoder.parameters()) + list(two_tower.parameters()), 
        lr=0.001
    )
    
    print("Training Two-Tower Retrieval model for 5 epochs...")
    two_tower.train()
    session_encoder.train()
    
    for epoch in range(1, 6):
        total_loss = 0.0
        for batch in train_loader:
            optimizer.zero_grad()
            
            # Forward user sequence
            session_vec = session_encoder(batch["session_history"].to(device))
            
            # Forward User Tower
            user_emb = user_tower(
                batch["user_id"].to(device),
                session_vec,
                batch["user_static"].to(device)
            )
            
            # Forward Product Tower for Positives
            # Simulate 384-dimensional text embeddings
            batch_size = batch["user_id"].size(0)
            dummy_text_emb = torch.randn(batch_size, 384, device=device)
            
            product_emb = product_tower(
                batch["pos_product_id"].to(device),
                batch["pos_aisle_id"].to(device),
                batch["pos_dept_id"].to(device),
                dummy_text_emb
            )
            
            # Forward Product Tower for Hard Negatives
            # We reshape the negatives and push them through
            neg_pids = batch["hard_negatives"].to(device) # (batch_size, 5)
            neg_aisles = batch["neg_aisle_ids"].to(device) # (batch_size, 5)
            neg_depts = batch["neg_dept_ids"].to(device)  # (batch_size, 5)
            
            # Reshape negatives to 1D to push through product_tower
            neg_pids_flat = neg_pids.view(-1)
            neg_aisles_flat = neg_aisles.view(-1)
            neg_depts_flat = neg_depts.view(-1)
            dummy_text_emb_neg = torch.randn(neg_pids_flat.size(0), 384, device=device)
            
            neg_emb_flat = product_tower(
                neg_pids_flat,
                neg_aisles_flat,
                neg_depts_flat,
                dummy_text_emb_neg
            )
            # Reshape back to (batch_size, 5, 64)
            hard_neg_emb = neg_emb_flat.view(batch_size, 5, -1)
            
            # InfoNCE loss
            loss = two_tower.compute_infonce_loss(user_emb, product_emb, hard_neg_emb)
            
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
            
        avg_loss = total_loss / len(train_loader)
        
        # Validation Loop for Recall@10
        two_tower.eval()
        session_encoder.eval()
        recall_hits = 0
        total_val_samples = 0
        
        # Precompute all product embeddings in validation mode
        # Since calculating all 50k takes memory, let's select all product IDs present in dataset mappings
        all_product_ids = sorted(list(mappings["product_to_idx"].values()))
        num_all_products = len(all_product_ids)
        
        # Embed all products in batches of 1000 to prevent memory blowup
        all_prod_embs_list = []
        with torch.no_grad():
            for i in range(0, num_all_products, 1000):
                batch_pids = all_product_ids[i:i+1000]
                batch_pids_t = torch.tensor(batch_pids, dtype=torch.long, device=device)
                
                # Retrieve aisle/dept details for these products
                batch_aisles = []
                batch_depts = []
                for p_idx in batch_pids:
                    a, d = dataset.prod_details.get(p_idx, (1, 1))
                    batch_aisles.append(a)
                    batch_depts.append(d)
                    
                batch_aisles_t = torch.tensor(batch_aisles, dtype=torch.long, device=device)
                batch_depts_t = torch.tensor(batch_depts, dtype=torch.long, device=device)
                dummy_text = torch.randn(len(batch_pids), 384, device=device)
                
                p_embs = product_tower(batch_pids_t, batch_aisles_t, batch_depts_t, dummy_text)
                all_prod_embs_list.append(p_embs)
                
            all_prod_embs = torch.cat(all_prod_embs_list, dim=0) # (num_all_products, 64)
            # L2 normalize
            all_prod_embs = all_prod_embs / torch.norm(all_prod_embs, dim=-1, keepdim=True).clamp(min=1e-12)
            
            # Recall benchmark
            for batch in val_loader:
                session_vec = session_encoder(batch["session_history"].to(device))
                user_emb = user_tower(
                    batch["user_id"].to(device),
                    session_vec,
                    batch["user_static"].to(device)
                )
                # L2 normalize user embedding
                user_emb = user_emb / torch.norm(user_emb, dim=-1, keepdim=True).clamp(min=1e-12)
                
                # Dot product similarity (batch_size, num_all_products)
                sims = torch.matmul(user_emb, all_prod_embs.T)
                
                # Get top-10 products for each user in the batch
                topk_indices = torch.topk(sims, k=10, dim=-1).indices # (batch_size, 10)
                
                # Maps index in all_product_ids back to 1-indexed product ID
                for j in range(user_emb.size(0)):
                    target_pid = batch["pos_product_id"][j].item()
                    topk_pids = [all_product_ids[idx] for idx in topk_indices[j].tolist()]
                    
                    if target_pid in topk_pids:
                        recall_hits += 1
                    total_val_samples += 1
                    
        recall_at_10 = recall_hits / max(1, total_val_samples)
        print(f"Epoch {epoch}/5 - Loss: {avg_loss:.4f} - Validation Recall@10: {recall_at_10:.4f}")
        two_tower.train()
        session_encoder.train()
        
    # Save final model weights
    torch.save({
        "session_encoder_state": session_encoder.state_dict(),
        "two_tower_state": two_tower.state_dict()
    }, "two_tower.pth")
    print("Saved model weights to two_tower.pth")
    
    # Save embeddings for ALL products in the metadata
    print("Generating product embeddings for ALL products...")
    two_tower.eval()
    product_embeddings_dict = {}
    
    all_product_ids = sorted(list(mappings["product_to_idx"].values()))
    all_prod_embs_list = []
    
    with torch.no_grad():
        for i in range(0, len(all_product_ids), 1000):
            batch_pids = all_product_ids[i:i+1000]
            batch_pids_t = torch.tensor(batch_pids, dtype=torch.long, device=device)
            batch_aisles = []
            batch_depts = []
            for p_idx in batch_pids:
                a, d = dataset.prod_details.get(p_idx, (1, 1))
                batch_aisles.append(a)
                batch_depts.append(d)
                
            batch_aisles_t = torch.tensor(batch_aisles, dtype=torch.long, device=device)
            batch_depts_t = torch.tensor(batch_depts, dtype=torch.long, device=device)
            dummy_text = torch.randn(len(batch_pids), 384, device=device)
            
            p_embs = product_tower(batch_pids_t, batch_aisles_t, batch_depts_t, dummy_text)
            all_prod_embs_list.append(p_embs.cpu().numpy())
            
    final_prod_embs = np.concatenate(all_prod_embs_list, axis=0)
    np.save("product_embeddings.npy", final_prod_embs)
    print(f"Saved product embeddings array of shape {final_prod_embs.shape} to product_embeddings.npy")
    
    # Also save a mapping of product index to Instacart product_id
    idx_to_product = {idx: pid for pid, idx in mappings["product_to_idx"].items()}
    # We will save this mapping for build_index.py
    product_idx_mapping = [idx_to_product[p_idx] for p_idx in all_product_ids]
    with open("product_id_list.pkl", "wb") as f:
        pickle.dump(product_idx_mapping, f)
    print("Saved product_id_list.pkl mapping")

    # Train dummy MultiTaskNCF weights as requested to make sure multitask_ncf.pth exists
    print("Saving dummy multitask_ncf.pth model weights...")
    from models import MultiTaskNCF
    ncf_model = MultiTaskNCF(input_dim=193).to(device)
    torch.save(ncf_model.state_dict(), "multitask_ncf.pth")
    print("Saved MultiTaskNCF weights to multitask_ncf.pth")

if __name__ == "__main__":
    train_and_evaluate()
