import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.core.database import init_db
from app.core.redis_client import redis_manager
from app.core.embeddings import embedding_service
from app.core.gemini_client import gemini_client
from app.seeds.seed_db import seed_data

from app.api.v1.telemetry import router as telemetry_router
from app.api.v1.recommendations import router as recs_router
from app.api.v1.search import router as search_router
from app.api.v1.bundle import router as bundle_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.privacy import router as privacy_router
from app.api.v1.guardrails import router as guardrails_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("intent_iq.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup Sequence
    logger.info("Initializing IntentIQ Backend Engine...")
    await init_db()
    await redis_manager.connect()
    embedding_service.load_model()
    gemini_client.initialize()
    await seed_data()
    logger.info("IntentIQ Engine startup complete.")
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
    allow_origins=["*"], # Allow all origins for hackathon demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
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
        "platform": "IntentIQ Multi-Intent Recommendation Engine",
        "version": settings.VERSION,
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
