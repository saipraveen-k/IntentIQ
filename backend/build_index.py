import faiss
import pickle
import numpy as np
import os

def build_faiss_index():
    embeddings_path = "product_embeddings.npy"
    mapping_path = "product_id_list.pkl"
    index_path = "faiss_index.bin"
    dict_path = "product_id_to_index.pkl"
    
    if not os.path.exists(embeddings_path) or not os.path.exists(mapping_path):
        print("Required product embeddings or mapping list not found. Run train_models.py first.")
        return
        
    # Load embeddings and product list
    embeddings = np.load(embeddings_path).astype('float32')
    with open(mapping_path, 'rb') as f:
        product_id_list = pickle.load(f)
        
    num_products, d = embeddings.shape
    print(f"Loaded {num_products} product embeddings of dimension {d}")
    
    # Normalize the embeddings (L2 norm) to compute cosine similarity using inner product
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    # Avoid division by zero
    norms[norms == 0] = 1.0
    normalized_embeddings = embeddings / norms
    
    # Setup IndexIVFPQ
    # For IVF, we need a flat quantizer
    quantizer = faiss.IndexFlatIP(d)
    
    # Defensive nlist setting to prevent clustering errors if data size is small
    nlist = min(100, max(4, num_products // 4))
    m = 8  # number of subquantizers
    nbits = 8  # number of bits per subquantizer
    
    print(f"Initializing IndexIVFPQ with nlist={nlist}, m={m}, nbits={nbits}")
    index = faiss.IndexIVFPQ(quantizer, d, nlist, m, nbits, faiss.METRIC_INNER_PRODUCT)
    
    # Train the index on the embeddings
    print("Training FAISS index...")
    index.train(normalized_embeddings)
    
    # Add the embeddings to the index
    print("Adding embeddings to FAISS index...")
    index.add(normalized_embeddings)
    
    # Save the index to disk
    faiss.write_index(index, index_path)
    
    # Save product_id to index mapping
    product_id_to_index = {pid: idx for idx, pid in enumerate(product_id_list)}
    with open(dict_path, 'wb') as f:
        pickle.dump(product_id_to_index, f)
        
    print(f"Index built successfully with {num_products} products")
    print(f"Saved FAISS index to {index_path} and mapping dict to {dict_path}")

if __name__ == "__main__":
    build_faiss_index()
