import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.core.database import init_db
from app.core.redis_client import redis_manager
from app.core.embeddings import embedding_service
from app.core.faiss_manager import faiss_manager
from app.core.gemini_client import gemini_client
from app.pipeline.dataset_manager import DatasetManager
from app.seeds.seed_db import seed_data

from app.api.v1.telemetry import router as telemetry_router
from app.api.v1.recommendations import router as recs_router
from app.api.v1.search import router as search_router
from app.api.v1.bundle import router as bundle_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.privacy import router as privacy_router
from app.api.v1.guardrails import router as guardrails_router
from app.api.v1.brain import router as brain_router
from app.api.v1.system import router as system_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("intent_iq.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup Sequence
    logger.info("Initializing IntentIQ Final Backend Intelligence Engine...")
    await init_db()
    await redis_manager.connect()
    embedding_service.load_model()
    gemini_client.initialize()

    # Part 5: Automatic Startup Health & Dataset Verification Check
    dataset_mgr = DatasetManager(base_dir="datasets")
    detection = dataset_mgr.detect_datasets()
    missing_ds = [name for name, status in detection.items() if not status["detected"]]
    
    if missing_ds:
        logger.warning(
            f"Dataset Startup Notice: Raw Kaggle dataset folder(s) {missing_ds} not detected in datasets/. "
            f"Operating with pre-seeded/ingested database catalog."
        )

    # Load FAISS vector index from disk
    faiss_disk_path = os.path.join(os.path.dirname(__file__), "faiss_index.bin")
    if not faiss_manager.load_from_disk(faiss_disk_path):
        logger.info("FAISS index not found on disk. Seeding database catalog and building vector index...")
        await seed_data()
    else:
        logger.info(f"FAISS vector index loaded successfully from disk ({len(faiss_manager.id_map)} vectors).")

    logger.info("IntentIQ AI Brain Engine startup complete.")
    yield
    # Shutdown Sequence
    logger.info("Shutting down IntentIQ Engine.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register All API Routers
app.include_router(brain_router, prefix=settings.API_V1_STR, tags=["AI Brain Orchestrator"])
app.include_router(system_router, prefix=settings.API_V1_STR, tags=["System & Dataset Health"])
app.include_router(telemetry_router, prefix=settings.API_V1_STR, tags=["Telemetry"])
app.include_router(recs_router, prefix=settings.API_V1_STR, tags=["Recommendations"])
app.include_router(search_router, prefix=settings.API_V1_STR, tags=["Semantic Search"])
app.include_router(bundle_router, prefix=settings.API_V1_STR, tags=["Bundling & Complete The Look"])
app.include_router(analytics_router, prefix=settings.API_V1_STR, tags=["Analytics & AI Ops"])
app.include_router(privacy_router, prefix=settings.API_V1_STR, tags=["DPDP Privacy Purge"])
app.include_router(guardrails_router, prefix=settings.API_V1_STR, tags=["Enterprise Guardrails"])

@app.get("/")
async def root():
    return {
        "status": "ONLINE",
        "platform": "IntentIQ Multi-Intent Recommendation Engine (Final Backend)",
        "version": settings.VERSION,
        "docs_url": "/docs"
    }

@app.get("/health", tags=["Health"])
@app.get(f"{settings.API_V1_STR}/health", tags=["Health"])
async def health_check():
    return {
        "status": "HEALTHY",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
