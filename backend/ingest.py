import os
import sys
import argparse
import asyncio
import logging
import time

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.database import init_db, async_engine, Base
from app.pipeline.dataset_manager import DatasetManager
from app.pipeline.validator import DataValidationEngine
from app.pipeline.sampler import SamplingEngine
from app.pipeline.hm_extractor import HMExtractor
from app.pipeline.amazon_extractor import AmazonExtractor
from app.pipeline.instacart_extractor import InstacartExtractor
from app.pipeline.embedding_pipeline import PipelineEmbeddingEngine
from app.pipeline.relationship_builder import RelationshipBuilder
from app.pipeline.session_builder import SessionBuilder
from app.pipeline.analytics_builder import AnalyticsBuilder
from app.repositories.product_repository import ProductRepository
from app.core.database import AsyncSessionLocal
from app.core.embeddings import embedding_service

# Module 11: Structured Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("intent_iq.ingest")

async def reset_database():
    logger.warning("Resetting database schema...")
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database schema reset complete.")

async def main():
    parser = argparse.ArgumentParser(description="IntentIQ Enterprise Data Intelligence Pipeline")
    parser.add_argument("--dataset", choices=["instacart", "hm", "amazon", "all"], default="instacart", help="Dataset to ingest (default: instacart)")
    parser.add_argument("--sample-size", type=int, default=1000, help="Sample size per dataset (default: 1000)")
    parser.add_argument("--rebuild-faiss", action="store_true", default=True, help="Rebuild FAISS vector index")
    parser.add_argument("--reset-db", action="store_true", help="Reset database schema before ingestion")
    parser.add_argument("--skip-embeddings", action="store_true", help="Skip sentence transformer vector embedding step")
    parser.add_argument("--stats", action="store_true", help="Display dataset detection status and exit")
    parser.add_argument("--validate", action="store_true", default=True, help="Run validation engine on extracted records")
    args = parser.parse_args()

    start_time = time.time()
    logger.info("=" * 70)
    logger.info("⚡ INTENTIQ ENTERPRISE DATA INTELLIGENCE PIPELINE")
    logger.info("=" * 70)

    # Module 1: Dataset Manager
    manager = DatasetManager(base_dir="datasets")
    detection = manager.detect_datasets()

    if args.stats:
        print("\nDATASET DETECTION STATUS:")
        for name, info in detection.items():
            status_str = "[OK DETECTED]" if info["detected"] else "[MISSING]"
            print(f" - {name.upper()}: {status_str} (Path: '{info['path']}')")
            if info["missing_files"]:
                print(f"   Missing files: {', '.join(info['missing_files'])}")
        return

    if args.reset_db:
        await reset_database()
    else:
        await init_db()

    # Load local SentenceTransformers model if embeddings enabled
    if not args.skip_embeddings:
        embedding_service.load_model()

    validator = DataValidationEngine() if args.validate else None
    sampler = SamplingEngine(default_sample_size=args.sample_size)

    extracted_products = []
    datasets_to_run = ["hm", "amazon", "instacart"] if args.dataset == "all" else [args.dataset]

    # Ingestion Loops
    for ds_name in datasets_to_run:
        if not manager.validate_dataset(ds_name):
            logger.warning(f"Skipping dataset '{ds_name}' (files not detected in datasets/{ds_name}/).")
            continue

        logger.info(f"Ingesting dataset: [{ds_name.upper()}] with sample size: {args.sample_size}")
        if ds_name == "hm":
            extractor = HMExtractor(manager.dataset_paths["hm"])
            records = extractor.process(sample_size=args.sample_size, validator=validator, sampler=sampler)
            extracted_products.extend(records)
        elif ds_name == "amazon":
            extractor = AmazonExtractor(manager.dataset_paths["amazon"])
            records = extractor.process(sample_size=args.sample_size, validator=validator, sampler=sampler)
            extracted_products.extend(records)
        elif ds_name == "instacart":
            extractor = InstacartExtractor(manager.dataset_paths["instacart"])
            records = extractor.process(sample_size=args.sample_size, validator=validator, sampler=sampler)
            extracted_products.extend(records)

    # Fallback to catalog_100 seed dataset if raw Kaggle files are missing
    if not extracted_products:
        logger.warning("No raw dataset files detected in datasets/. Using IntentIQ fallback catalog seed...")
        from app.seeds.seed_db import seed_data
        await seed_data()
        async with AsyncSessionLocal() as db:
            repo = ProductRepository(db)
            db_prods = await repo.get_all(limit=args.sample_size)
            extracted_products = [
                {
                    "id": p.id,
                    "title": p.title,
                    "description": p.description,
                    "category": p.category,
                    "brand": p.brand,
                    "sub_category": p.sub_category,
                    "price": p.price
                } for p in db_prods
            ]

    # Save Products to Database
    logger.info(f"Persisting {len(extracted_products)} normalized records into PostgreSQL database...")
    async with AsyncSessionLocal() as db:
        repo = ProductRepository(db)
        for p_dict in extracted_products:
            existing = await repo.get_by_id(p_dict["id"])
            if not existing:
                try:
                    await repo.save_product(p_dict)
                except Exception:
                    pass

    # Module 6: Embeddings & FAISS
    if not args.skip_embeddings and extracted_products:
        emb_engine = PipelineEmbeddingEngine()
        await emb_engine.process_and_index(extracted_products, rebuild_faiss=args.rebuild_faiss)

    # Module 7: Relationship Builder
    if extracted_products:
        rel_builder = RelationshipBuilder()
        await rel_builder.build_relationships(extracted_products)

    # Module 8: Session Builder
    if extracted_products:
        sess_builder = SessionBuilder()
        await sess_builder.build_sessions(extracted_products, num_sessions=min(500, args.sample_size))

    # Module 9: Analytics Builder
    if extracted_products:
        analytics_builder = AnalyticsBuilder()
        await analytics_builder.build_analytics(extracted_products, num_sessions=min(500, args.sample_size))

    elapsed = round(time.time() - start_time, 2)
    logger.info("=" * 70)
    logger.info(f"✨ PIPELINE EXECUTION COMPLETE in {elapsed}s")
    logger.info(f" - Records Processed: {len(extracted_products)}")
    logger.info(f" - FAISS Vector Index: {'Rebuilt & Persisted' if args.rebuild_faiss else 'Skipped'}")
    logger.info("=" * 70)

if __name__ == "__main__":
    asyncio.run(main())
