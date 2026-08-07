import torch
import numpy as np
import pytest
from models import SessionEncoder, UserTower, ProductTower, TwoTowerModel, MultiTaskNCF

def test_session_encoder():
    batch_size = 4
    seq_len = 20
    num_products = 100
    
    encoder = SessionEncoder(num_products=num_products, embedding_dim=16, hidden_dim=32)
    dummy_input = torch.randint(0, num_products, (batch_size, seq_len))
    
    out = encoder(dummy_input)
    assert out.shape == (batch_size, 32)

def test_user_tower():
    batch_size = 4
    num_users = 50
    
    tower = UserTower(num_users=num_users, user_emb_dim=16, session_dim=32, static_dim=8, output_dim=16)
    
    dummy_user_ids = torch.randint(0, num_users, (batch_size,))
    dummy_session_vectors = torch.randn(batch_size, 32)
    dummy_static = torch.randn(batch_size, 8)
    
    out = tower(dummy_user_ids, dummy_session_vectors, dummy_static)
    assert out.shape == (batch_size, 16)

def test_product_tower():
    batch_size = 4
    num_products = 100
    num_aisles = 20
    num_departments = 10
    
    tower = ProductTower(
        num_products=num_products,
        num_aisles=num_aisles,
        num_departments=num_departments,
        prod_emb_dim=16,
        aisle_emb_dim=8,
        dept_emb_dim=8,
        text_dim=384,
        output_dim=16
    )
    
    dummy_pids = torch.randint(0, num_products, (batch_size,))
    dummy_aisles = torch.randint(0, num_aisles, (batch_size,))
    dummy_depts = torch.randint(0, num_departments, (batch_size,))
    dummy_text = torch.randn(batch_size, 384)
    
    out = tower(dummy_pids, dummy_aisles, dummy_depts, dummy_text)
    assert out.shape == (batch_size, 16)

def test_two_tower_model_loss():
    batch_size = 4
    output_dim = 16
    
    user_tower = UserTower(num_users=10, user_emb_dim=8, session_dim=16, static_dim=4, output_dim=output_dim)
    product_tower = ProductTower(num_products=10, num_aisles=5, num_departments=3, prod_emb_dim=8, aisle_emb_dim=4, dept_emb_dim=4, text_dim=32, output_dim=output_dim)
    
    two_tower = TwoTowerModel(user_tower, product_tower)
    
    user_emb = torch.randn(batch_size, output_dim)
    product_emb = torch.randn(batch_size, output_dim)
    hard_neg_emb = torch.randn(batch_size, 5, output_dim)
    
    loss = two_tower.compute_infonce_loss(user_emb, product_emb, hard_neg_emb)
    assert loss.item() > 0.0

def test_multitask_ncf():
    batch_size = 4
    emb_dim = 64
    
    ncf = MultiTaskNCF(input_dim=193, hidden_dims=[128, 64, 32], weights=[0.5, 0.3, 0.2])
    
    user_emb = torch.randn(batch_size, emb_dim)
    product_emb = torch.randn(batch_size, emb_dim)
    
    click, cart, purchase = ncf(user_emb, product_emb)
    
    assert click.shape == (batch_size, 1)
    assert cart.shape == (batch_size, 1)
    assert purchase.shape == (batch_size, 1)
    
    # Check binary probability range
    assert torch.all(click >= 0.0) and torch.all(click <= 1.0)
    assert torch.all(cart >= 0.0) and torch.all(cart <= 1.0)
    assert torch.all(purchase >= 0.0) and torch.all(purchase <= 1.0)
    
    # Loss computation check
    click_true = torch.randint(0, 2, (batch_size, 1), dtype=torch.float32)
    cart_true = torch.randint(0, 2, (batch_size, 1), dtype=torch.float32)
    purchase_true = torch.randint(0, 2, (batch_size, 1), dtype=torch.float32)
    
    loss, cl, cal, pl = ncf.compute_loss(click, click_true, cart, cart_true, purchase, purchase_true)
    assert loss.item() > 0.0
    assert cl.item() > 0.0
    assert cal.item() > 0.0
    assert pl.item() > 0.0
