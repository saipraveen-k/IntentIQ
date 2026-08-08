import os
import sys
import time
import json
import logging
import asyncio
import numpy as np
import pandas as pd
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

# Add backend directory to sys.path
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.core.database import get_db, init_db
from app.auth import FirebaseAuthMiddleware
from app.core.embeddings import embedding_service
from app.core.faiss_manager import faiss_manager
from app.core.cross_encoder import cross_encoder_service
from app.core.recommendation_models import recommendation_model_service

# Routers
from app.routers.events import router as events_router, event_batch_worker
from app.routers.user import router as user_router
from app.api.v1.recommendations import router as recommendations_api_router
from app.api.v1.search import router as search_api_router
from app.api.v1.bundle import router as bundle_api_router
from app.api.v1.brain import router as brain_api_router
from app.api.v1.analytics import router as analytics_api_router
from app.api.v1.privacy import router as privacy_api_router
from app.api.v1.guardrails import router as guardrails_api_router
from app.api.v1.system import router as system_api_router
from app.api.v1.telemetry import router as telemetry_api_router

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("intentiq_server")

app = FastAPI(
    title="IntentIQ Real-Time Recommendation & Discovery Engine API",
    version="1.0.0",
    description="Real-time recommendation engine with vector similarity, basket graph intelligence, and neural ranking."
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Firebase Auth middleware
app.add_middleware(FirebaseAuthMiddleware)

# Include API v1 Routers
app.include_router(events_router, prefix="/api/v1")
app.include_router(user_router, prefix="/api/v1")
app.include_router(recommendations_api_router, prefix="/api/v1")
app.include_router(search_api_router, prefix="/api/v1")
app.include_router(bundle_api_router, prefix="/api/v1")
app.include_router(brain_api_router, prefix="/api/v1")
app.include_router(analytics_api_router, prefix="/api/v1")
app.include_router(privacy_api_router, prefix="/api/v1")
app.include_router(guardrails_api_router, prefix="/api/v1")
app.include_router(system_api_router, prefix="/api/v1")
app.include_router(telemetry_api_router, prefix="/api/v1")

# Global data containers
product_details: Dict[str, Dict[str, Any]] = {}
product_popularity: Dict[str, int] = {}
association_rules_dict: Dict[str, Any] = {}

class LegacyFeedRequest(BaseModel):
    user_id: Optional[str] = None
    session_history: List[int] = []

class LegacySearchRequest(BaseModel):
    query: str
    user_id: Optional[str] = None

class LegacyBundleRequest(BaseModel):
    product_id: int

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000.0
    response.headers["X-Process-Time-Ms"] = f"{process_time:.2f}"
    return response

@app.on_event("startup")
async def startup_event():
    logger.info("=" * 60)
    logger.info("🚀 STARTING INTENTIQ PRODUCTION INTELLIGENCE SERVER")
    logger.info("=" * 60)

    # Start background task for telemetry event batch worker
    asyncio.create_task(event_batch_worker())

    # 1. Initialize SQLite / PostgreSQL tables
    await init_db()

    # 2. Initialize Singletons
    embedding_service.load_model()
    cross_encoder_service.load_model()
    recommendation_model_service.load_models(BACKEND_DIR)

    # 3. Load Canonical FAISS Index
    canonical_faiss_path = os.path.join(BACKEND_DIR, "data", "indexes", "products.faiss")
    faiss_loaded = faiss_manager.load_from_disk(canonical_faiss_path)

    # 4. Load Canonical Product Metadata
    metadata_path = os.path.join(BACKEND_DIR, "data", "processed", "product_metadata.parquet")
    if os.path.exists(metadata_path):
        df_meta = pd.read_parquet(metadata_path)
        for row in df_meta.itertuples():
            product_details[str(row.product_id)] = {
                "name": row.title,
                "title": row.title,
                "department": row.department,
                "aisle": row.aisle,
                "price": float(row.price),
                "rating": float(row.rating),
                "review_count": int(row.review_count),
                "department_id": int(row.department_id),
                "aisle_id": int(row.aisle_id),
                "image_url": str(row.image_url)
            }
        logger.info(f"Loaded {len(product_details):,} canonical product metadata records.")

    # 5. Load Popularity Index & Association Rules
    pop_path = os.path.join(BACKEND_DIR, "data", "processed", "product_popularity.json")
    if os.path.exists(pop_path):
        with open(pop_path, "r", encoding="utf-8") as f:
            product_popularity.update(json.load(f))
        logger.info(f"Loaded popularity index for {len(product_popularity):,} products.")

    rules_path = os.path.join(BACKEND_DIR, "data", "processed", "association_rules.json")
    if os.path.exists(rules_path):
        with open(rules_path, "r", encoding="utf-8") as f:
            association_rules_dict.update(json.load(f))
        logger.info(f"Loaded association rules for {len(association_rules_dict):,} products.")

    # 6. Startup Validation Assertions
    faiss_val = faiss_manager.validate(
        canonical_product_count=len(product_details),
        embedding_count=len(product_details)
    )
    logger.info(f"Startup FAISS Status: {faiss_val['status']}")

# ==============================================================================
# Legacy Compatibility Endpoints (backed by genuine pipeline)
# ==============================================================================

@app.get("/api/v1/persona/{persona_name}")
async def get_persona_history(persona_name: str):
    from app.agents.intent_agent import intent_agent, PERSONA_PROFILES
    profile = PERSONA_PROFILES.get(persona_name.lower())
    matching_pids = []
    
    if profile:
        kw = persona_name.lower()
        for pid, details in product_details.items():
            if kw in details["name"].lower() or kw in details["department"].lower() or kw in details["aisle"].lower():
                matching_pids.append(int(pid) if pid.isdigit() else pid)
                if len(matching_pids) >= 10:
                    break

    if not matching_pids:
        matching_pids = [int(p) if p.isdigit() else p for p in list(product_details.keys())[:10]]

    return {"persona": persona_name, "session_history": matching_pids}

@app.get("/health")
async def health_check():
    return {
        "status": "HEALTHY" if faiss_manager.is_initialized else "DEGRADED",
        "faiss_index_size": len(faiss_manager.id_map),
        "embedding_dimension": 384,
        "catalog_size": len(product_details),
        "faiss_status": faiss_manager.status
    }

@app.get("/")
async def read_root():
    return {
        "service": "IntentIQ Recommendation & Discovery Engine API",
        "status": "online",
        "version": "1.0.0",
        "documentation": "/docs",
        "health": "/api/v1/system/health",
        "endpoints": {
            "feed": "/api/v1/recommendations/feed",
            "semantic_search": "/api/v1/search/semantic",
            "bundle": "/api/v1/bundle",
            "events": "/api/v1/event",
            "brain": "/api/v1/brain/analyze",
            "system_health": "/api/v1/system/health"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
