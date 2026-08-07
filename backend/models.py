import torch
import torch.nn as nn
import torch.nn.functional as F

# Automatic device detection
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

class SessionEncoder(nn.Module):
    """
    SessionEncoder: A GRU-based recurrent network that processes a sequence of clicked 
    product IDs (max length 20) and outputs a 64-dimensional session intent vector.
    """
    def __init__(self, num_products, embedding_dim=32, hidden_dim=64):
        super().__init__()
        # Pad index is 0, so num_products + 1 to account for 0
        self.embedding = nn.Embedding(num_products + 1, embedding_dim, padding_idx=0)
        self.gru = nn.GRU(embedding_dim, hidden_dim, batch_first=True)
        self.hidden_dim = hidden_dim

    def forward(self, product_seqs):
        """
        product_seqs: Tensor of shape (batch_size, seq_len) containing product ID indices
        Returns: Tensor of shape (batch_size, 64) representing session vectors
        """
        embedded = self.embedding(product_seqs) # (batch_size, seq_len, embedding_dim)
        out, hidden = self.gru(embedded)        # out: (batch_size, seq_len, hidden_dim), hidden: (1, batch_size, hidden_dim)
        return hidden.squeeze(0)                # (batch_size, hidden_dim)

class UserTower(nn.Module):
    """
    UserTower: Maps user identifier, active session vectors, and static demographic features
    to a unified 64-dimensional user intent representation.
    """
    def __init__(self, num_users, user_emb_dim=32, session_dim=64, static_dim=8, output_dim=64):
        super().__init__()
        # Pad index is 0, so num_users + 1
        self.user_embedding = nn.Embedding(num_users + 1, user_emb_dim, padding_idx=0)
        input_dim = user_emb_dim + session_dim + static_dim
        self.mlp = nn.Sequential(
            nn.Linear(input_dim, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, output_dim)
        )

    def forward(self, user_ids, session_vectors, static_features):
        """
        user_ids: Tensor of shape (batch_size,)
        session_vectors: Tensor of shape (batch_size, 64)
        static_features: Tensor of shape (batch_size, 8)
        """
        user_emb = self.user_embedding(user_ids) # (batch_size, user_emb_dim)
        x = torch.cat([user_emb, session_vectors, static_features], dim=-1) # (batch_size, input_dim)
        return self.mlp(x) # (batch_size, output_dim)

class ProductTower(nn.Module):
    """
    ProductTower: Maps product identifiers, categories (aisles, departments), and multi-modal/text 
    embeddings to a unified 64-dimensional product representation.
    """
    def __init__(self, num_products, num_aisles, num_departments, prod_emb_dim=32, aisle_emb_dim=16, dept_emb_dim=16, text_dim=384, output_dim=64):
        super().__init__()
        self.product_embedding = nn.Embedding(num_products + 1, prod_emb_dim, padding_idx=0)
        self.aisle_embedding = nn.Embedding(num_aisles + 1, aisle_emb_dim, padding_idx=0)
        self.dept_embedding = nn.Embedding(num_departments + 1, dept_emb_dim, padding_idx=0)
        input_dim = prod_emb_dim + aisle_emb_dim + dept_emb_dim + text_dim
        self.mlp = nn.Sequential(
            nn.Linear(input_dim, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, output_dim)
        )

    def forward(self, product_ids, aisle_ids, dept_ids, text_embeddings):
        """
        product_ids: Tensor of shape (batch_size,)
        aisle_ids: Tensor of shape (batch_size,)
        dept_ids: Tensor of shape (batch_size,)
        text_embeddings: Tensor of shape (batch_size, 384)
        """
        prod_emb = self.product_embedding(product_ids)
        aisle_emb = self.aisle_embedding(aisle_ids)
        dept_emb = self.dept_embedding(dept_ids)
        x = torch.cat([prod_emb, aisle_emb, dept_emb, text_embeddings], dim=-1)
        return self.mlp(x) # (batch_size, output_dim)

class TwoTowerModel(nn.Module):
    """
    TwoTowerModel: Joint embedding retrieval network comprising a UserTower and ProductTower.
    Optimized via contrastive InfoNCE loss with in-batch and hard negatives.
    """
    def __init__(self, user_tower: UserTower, product_tower: ProductTower):
        super().__init__()
        self.user_tower = user_tower
        self.product_tower = product_tower

    def forward(self, user_ids, session_vectors, static_features, product_ids, aisle_ids, dept_ids, text_embeddings):
        user_emb = self.user_tower(user_ids, session_vectors, static_features)
        product_emb = self.product_tower(product_ids, aisle_ids, dept_ids, text_embeddings)
        return user_emb, product_emb

    def compute_infonce_loss(self, user_emb, product_emb, hard_neg_emb=None, temperature=0.07):
        """
        Calculates InfoNCE contrastive loss over click events.
        Includes optional hard negatives of shape (batch_size, num_hard_negs, output_dim).
        """
        batch_size = user_emb.size(0)
        
        # Positive dot product similarity score: (batch_size, 1)
        pos_score = torch.sum(user_emb * product_emb, dim=-1, keepdim=True) / temperature
        
        logits_list = [pos_score]
        
        # If hard negatives are provided, compute similarity and append
        if hard_neg_emb is not None:
            # user_emb: (batch_size, 1, output_dim), hard_neg_emb: (batch_size, num_hard_negs, output_dim)
            # hard_neg_score: (batch_size, num_hard_negs)
            hard_neg_score = torch.sum(user_emb.unsqueeze(1) * hard_neg_emb, dim=-1) / temperature
            logits_list.append(hard_neg_score)
            
        # In-batch negative scores: (batch_size, batch_size)
        in_batch_score = torch.matmul(user_emb, product_emb.T) / temperature
        # Exclude self-matching by filling diagonal with a large negative number
        mask = torch.eye(batch_size, device=user_emb.device).bool()
        in_batch_score = in_batch_score.masked_fill(mask, -9e15)
        logits_list.append(in_batch_score)
        
        # Concatenate logits: shape (batch_size, 1 + num_hard_negs + batch_size)
        logits = torch.cat(logits_list, dim=-1)
        
        # Index 0 is the positive match
        targets = torch.zeros(batch_size, dtype=torch.long, device=user_emb.device)
        return F.cross_entropy(logits, targets)

class MultiTaskNCF(nn.Module):
    """
    MultiTaskNCF: Multi-Task Neural Collaborative Filtering network.
    Combines user and product embeddings with dot product & element-wise cross features.
    Predicts Click, Add-to-Cart, and Purchase probabilities.
    """
    def __init__(self, input_dim=193, hidden_dims=[512, 256, 128], weights=[0.5, 0.3, 0.2]):
        super().__init__()
        # input_dim: user_emb (64) + product_emb (64) + element_product (64) + dot_product (1) = 193
        self.mlp = nn.Sequential(
            nn.Linear(input_dim, hidden_dims[0]),
            nn.BatchNorm1d(hidden_dims[0]),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_dims[0], hidden_dims[1]),
            nn.BatchNorm1d(hidden_dims[1]),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_dims[1], hidden_dims[2]),
            nn.BatchNorm1d(hidden_dims[2]),
            nn.ReLU(),
            nn.Dropout(0.2)
        )
        self.click_head = nn.Linear(hidden_dims[2], 1)
        self.cart_head = nn.Linear(hidden_dims[2], 1)
        self.purchase_head = nn.Linear(hidden_dims[2], 1)
        
        self.weights = weights

    def forward(self, user_emb, product_emb):
        """
        user_emb: Tensor of shape (batch_size, 64)
        product_emb: Tensor of shape (batch_size, 64)
        """
        dot_product = torch.sum(user_emb * product_emb, dim=-1, keepdim=True) # (batch_size, 1)
        element_wise_product = user_emb * product_emb                         # (batch_size, 64)
        
        # Concatenate features
        x = torch.cat([user_emb, product_emb, element_wise_product, dot_product], dim=-1)
        
        shared_features = self.mlp(x)
        
        click_prob = torch.sigmoid(self.click_head(shared_features))
        cart_prob = torch.sigmoid(self.cart_head(shared_features))
        purchase_prob = torch.sigmoid(self.purchase_head(shared_features))
        
        return click_prob, cart_prob, purchase_prob

    def compute_loss(self, click_pred, click_true, cart_pred, cart_true, purchase_pred, purchase_true):
        """
        Weighted multi-task binary cross-entropy loss function.
        """
        click_loss = F.binary_cross_entropy(click_pred, click_true)
        cart_loss = F.binary_cross_entropy(cart_pred, cart_true)
        purchase_loss = F.binary_cross_entropy(purchase_pred, purchase_true)
        
        total_loss = (self.weights[0] * click_loss + 
                      self.weights[1] * cart_loss + 
                      self.weights[2] * purchase_loss)
        return total_loss, click_loss, cart_loss, purchase_loss
