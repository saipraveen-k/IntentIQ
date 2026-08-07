# IntentIQ Data Intelligence Pipeline Guide

This document describes the design, execution steps, and pipeline architecture of the IntentIQ data intelligence pipeline.

---

## 1. Pipeline Overview

The data pipeline extracts, normalizes, validates, and indexes e-commerce datasets to prepare them for real-time vector similarity search and basket co-occurrence analysis.

```
Raw CSV Files (Instacart / Catalog Seed)
                  │
                  ▼
1. Extractor & Schema Mapper
                  │
                  ▼
2. Data Validation Engine
                  │
                  ▼
3. Sampling Engine
                  │
                  ▼
4. Database Persistence (PostgreSQL / SQLite)
                  │
                  ▼
5. SentenceTransformers Embedding Engine
                  │
                  ▼
6. FAISS HNSW Vector Store Indexer (faiss_index.bin)
                  │
                  ▼
7. Product Co-Occurrence & Session Relationship Builder
```

---

## 2. Dataset Processing Modules

### Module 1: Dataset Manager (`app/pipeline/dataset_manager.py`)
Detects local dataset availability in `datasets/` and validates required CSV files (`products.csv`, `departments.csv`, `aisles.csv`, `orders.csv`).

### Module 2: Extractors & Schema Mappers (`app/pipeline/instacart_extractor.py`)
Streams raw CSV records and maps entity fields into normalized product schemas:
- **`product_name`** $\rightarrow$ `title`
- **`department`** $\rightarrow$ `category`
- **`aisle`** $\rightarrow$ `sub_category`

### Module 3: Validation Engine (`app/pipeline/validator.py`)
Validates entity schemas for non-empty titles, valid pricing floats, and required category identifiers.

### Module 4: Sampling Engine (`app/pipeline/sampler.py`)
Applies configurable sample filtering (default: 1,000 products, 5,000 sessions) to optimize memory consumption during testing.

### Module 5: Embedding Engine (`app/pipeline/embedding_pipeline.py`)
Constructs textual descriptions from normalized product fields and generates 384-dimensional dense vector embeddings using `sentence-transformers/all-MiniLM-L6-v2`.

### Module 6: FAISS Vector Store (`app/core/faiss_manager.py`)
Indexes generated embeddings into a serialized FAISS Flat Inner Product / HNSW vector index (`faiss_index.bin`) and metadata store (`faiss_index.bin.meta`).

### Module 7: Relationship & Session Builder (`app/pipeline/relationship_builder.py` & `session_builder.py`)
Computes item pair co-occurrence matrices from historical basket orders to form bundle relationship recommendations and generates simulated user interaction clickstream timelines.

---

## 3. CLI Pipeline Execution

Run the ingestion script from the `backend/` directory:

```bash
cd backend

# Ingest Instacart dataset with sample size of 1000 items
python ingest.py --dataset instacart --sample-size 1000

# Display dataset detection status
python ingest.py --stats

# Rebuild database schema and re-index FAISS
python ingest.py --dataset instacart --sample-size 1000 --reset-db --rebuild-faiss
```

### CLI Command Options

| Argument | Description | Default |
| :--- | :--- | :--- |
| `--dataset` | Target dataset (`instacart`, `hm`, `amazon`, `all`) | `instacart` |
| `--sample-size` | Number of product records to extract and index | `1000` |
| `--rebuild-faiss` | Force rebuilding of `faiss_index.bin` | `True` |
| `--reset-db` | Drop and re-create database tables before ingestion | `False` |
| `--skip-embeddings`| Skip vector embedding generation step | `False` |
| `--stats` | Display local dataset file detection status and exit | `False` |
