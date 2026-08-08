import os
import logging
import torch
import numpy as np
from typing import Dict, Any, List, Tuple, Optional

logger = logging.getLogger("intent_iq.recommendation_models")

device = torch.device("cpu")

class RecommendationModelService:
    """
    Singleton service managing TwoTower and MultiTaskNCF inference models.
    All representations operate in the canonical 384-dimensional vector space.
    """
    def __init__(self):
        self.session_encoder = None
        self.user_tower = None
        self.product_tower = None
        self.two_tower = None
        self.ncf_model = None
        self.is_loaded = False
        self.status = "NOT_INITIALIZED"

    def load_models(self, backend_dir: str):
        try:
            sys_path = os.path.abspath(backend_dir)
            if sys_path not in sys.path:
                sys.path.insert(0, sys_path)
            from models import SessionEncoder, UserTower, ProductTower, TwoTowerModel, MultiTaskNCF

            checkpoint_path = os.path.join(backend_dir, "two_tower.pth")
            ncf_path = os.path.join(backend_dir, "multitask_ncf.pth")

            num_products = 49695
            num_users = 206215
            num_aisles = 140
            num_departments = 25

            self.session_encoder = SessionEncoder(num_products=num_products, embedding_dim=32, hidden_dim=64).to(device)
            self.user_tower = UserTower(num_users=num_users, user_emb_dim=32, session_dim=64, static_dim=8, output_dim=64).to(device)
            self.product_tower = ProductTower(num_products=num_products, num_aisles=num_aisles, num_departments=num_departments, prod_emb_dim=32, aisle_emb_dim=16, dept_emb_dim=16, text_dim=384, output_dim=64).to(device)
            self.two_tower = TwoTowerModel(self.user_tower, self.product_tower).to(device)

            if os.path.exists(checkpoint_path):
                ckpt = torch.load(checkpoint_path, map_location=device)
                if "session_encoder_state" in ckpt:
                    self.session_encoder.load_state_dict(ckpt["session_encoder_state"])
                if "two_tower_state" in ckpt:
                    self.two_tower.load_state_dict(ckpt["two_tower_state"])
                logger.info("Loaded TwoTower neural checkpoints.")

            self.session_encoder.eval()
            self.two_tower.eval()

            # MultiTaskNCF
            self.ncf_model = MultiTaskNCF(input_dim=193).to(device)
            if os.path.exists(ncf_path):
                self.ncf_model.load_state_dict(torch.load(ncf_path, map_location=device))
                logger.info("Loaded MultiTaskNCF neural checkpoint.")
            self.ncf_model.eval()

            self.is_loaded = True
            self.status = "READY"
            logger.info("RecommendationModelService initialized and set to eval mode.")
        except Exception as e:
            logger.error(f"Error loading recommendation models: {e}. Entering fallback prior mode.")
            self.status = "DEGRADED"
            self.is_loaded = False

    def predict_ncf_scores(self, user_emb_rep: torch.Tensor, cand_emb_t: torch.Tensor) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Predicts CTR, Add-to-cart, and Purchase probabilities.
        """
        if self.is_loaded and self.ncf_model:
            with torch.no_grad():
                click_p, cart_p, purch_p = self.ncf_model(user_emb_rep, cand_emb_t)
                return (
                    click_p.squeeze(-1).cpu().numpy(),
                    cart_p.squeeze(-1).cpu().numpy(),
                    purch_p.squeeze(-1).cpu().numpy()
                )
        # Fallback prior
        batch_size = user_emb_rep.size(0)
        return (
            np.full(batch_size, 0.15, dtype=np.float32),
            np.full(batch_size, 0.08, dtype=np.float32),
            np.full(batch_size, 0.05, dtype=np.float32)
        )

recommendation_model_service = RecommendationModelService()
