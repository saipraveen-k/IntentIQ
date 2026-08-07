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

from sqlalchemy.future import select
from sqlalchemy import func
from app.core.database import init_db, AsyncSessionLocal
from app.models.domain import Product, ProductEmbedding, UserSession

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("intent_iq.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup Sequence
    await init_db()
    await redis_manager.connect()
    embedding_service.load_model()
    gemini_client.initialize()

    async with AsyncSessionLocal() as session:
        prod_count = (await session.execute(select(func.count(Product.id)))).scalar() or 0
        emb_count = (await session.execute(select(func.count(ProductEmbedding.id)))).scalar() or 0
        sess_count = (await session.execute(select(func.count(UserSession.session_id)))).scalar() or 0

    if prod_count == 0:
        logger.info("Database catalog empty. Seeding catalog and building vector index...")
        await seed_data()
        async with AsyncSessionLocal() as session:
            prod_count = (await session.execute(select(func.count(Product.id)))).scalar() or 0
            emb_count = (await session.execute(select(func.count(ProductEmbedding.id)))).scalar() or 0
            sess_count = (await session.execute(select(func.count(UserSession.session_id)))).scalar() or 0

    # Load & Sync FAISS vector index
    faiss_disk_path = os.path.join(os.path.dirname(__file__), "faiss_index.bin")
    loaded_faiss = faiss_manager.load_from_disk(faiss_disk_path)

    if not loaded_faiss or len(faiss_manager.id_map) != emb_count:
        logger.info(f"Syncing FAISS index (FAISS: {len(faiss_manager.id_map)} vectors, DB: {emb_count} embeddings)...")
        async with AsyncSessionLocal() as session:
            stmt = select(Product.id, Product.title, Product.brand, Product.category, ProductEmbedding.vector_json).join(ProductEmbedding, Product.id == ProductEmbedding.product_id)
            records = (await session.execute(stmt)).all()
            if records:
                prods_list = [{"id": r[0], "title": r[1], "brand": r[2], "category": r[3]} for r in records]
                embs_list = [r[4] for r in records]
                faiss_manager.reset()
                faiss_manager.add_products(prods_list, embs_list)
                faiss_manager.save_to_disk(faiss_disk_path)

    # Dataset detection status check
    dataset_mgr = DatasetManager(base_dir="datasets")
    detection = dataset_mgr.detect_datasets()
    missing_ds = [name for name, status in detection.items() if not status["detected"]]
    if missing_ds and prod_count > 0:
        logger.info("Dataset Status: Using existing database catalog.")

    db_type = "Neon PostgreSQL" if "postgresql" in settings.DATABASE_URL else "SQLite"
    redis_status = "Local Memory Cache" if redis_manager.is_fallback else "Connected"
    gemini_status = "Connected" if gemini_client.model is not None else "Template Synthesizer Mode"

    # Startup Banner (Phase 10)
    print("\n" + "━" * 42)
    print("IntentIQ AI Engine")
    print(f"Environment: Development")
    print(f"Database: Connected ({db_type})")
    print(f"Redis: {redis_status}")
    print(f"Gemini: {gemini_status}")
    print("Embeddings: Loaded")
    print(f"FAISS: {len(faiss_manager.id_map)} vectors")
    print(f"Products: {prod_count}")
    print(f"Sessions: {sess_count}")
    print("API Status: Healthy")
    print("Ready to serve requests")
    print("━" * 42 + "\n")

    yield
    # Shutdown Sequence
    logger.info("Shutting down IntentIQ Engine.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

from fastapi import Request
from fastapi.responses import JSONResponse

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception during request processing to {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "status": "ERROR",
            "message": "Internal server error occurred.",
            "detail": str(exc) if settings.DEBUG else "An unexpected error occurred. Please try again.",
            "path": str(request.url.path)
        }
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
