# IntentIQ — AI-Powered Multi-Intent Shopping Discovery Engine

### *Understanding Shopper Intent, Not Just Shopper History*

[![AI Build 2026](https://img.shields.io/badge/AI--Build--2026-Hackathon--Submission-6366f1?style=for-the-badge&logo=google&logoColor=white)](https://github.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![Python 3.11](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![TypeScript 5.4](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-06b6d4?style=for-the-badge&logo=open-source-initiative&logoColor=white)](LICENSE)
[![Docker Ready](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](docker-compose.yml)

---

## 📌 Executive Overview

Traditional e-commerce recommendation systems suffer from **single-intent bias**, **cold-start penalties**, and **opaque recommendations**. They assume a user's past purchase history represents their current session goal.

**IntentIQ** solves this by inferring multi-intent shopper goals in real time using clickstream dwell time, search query decompositions, and Instacart basket sequence history. Powered by **FAISS HNSW vector search**, **Sentence Transformers**, and **Gemini 1.5 Flash**, IntentIQ delivers sub-20ms personalized feeds with transparent Explainable AI (XAI) rationales.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    Client["Client / Next.js 15 Storefront"] --> API["FastAPI Router /api/v1/brain/analyze"]
    API --> Brain["AIBrainOrchestrator"]

    subgraph Agents ["7 Specialised AI Agents Sequence"]
        A1["1. GuardrailAgent"] -->|Validate & Sanitize| A2["2. IntentAgent"]
        A2 -->|Update User Vector| A3["3. SearchAgent"]
        A3 -->|Semantic Search| A4["4. RecommendationAgent"]
        A4 -->|Hybrid Top-10 Recs| A5["5. BundleAgent"]
        A5 -->|Complete the Look| A6["6. ExplainabilityAgent"]
        A6 -->|Gemini/Template XAI| A7["7. AnalyticsAgent"]
        A7 -->|Audit & SLA Metrics| Merger["Unified Payload & Trace"]
    end

    Brain --> Agents
    Merger --> Client
```

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | Next.js 15, React 19, TypeScript, TailwindCSS | Glassmorphic dark UI, Apple/Linear aesthetic |
| **Backend** | FastAPI, Python 3.11, Pydantic, SQLAlchemy | Async Modular Monolith architecture |
| **Database** | PostgreSQL / Neon Cloud DB, SQLite fallback | Relational storage for products, orders, & audit logs |
| **Cache Store** | Redis / In-Memory Fallback | User intent vectors, search results, & feed caching |
| **Vector Engine** | FAISS HNSW, NumPy Cosine Similarity | Sub-millisecond 384-dim dense vector search |
| **AI Models** | `sentence-transformers/all-MiniLM-L6-v2`, Gemini 1.5 Flash | Precomputed text embeddings & natural language XAI |

---

## 📁 Repository Folder Structure

```
IntentIQ/
├── backend/
│   ├── app/
│   │   ├── agents/          # 7 Domain AI Agents (Intent, Search, Recs, Bundle, XAI, Analytics, Guardrail)
│   │   ├── api/v1/          # REST Controllers (/brain, /recommendations, /search, /bundle, /system)
│   │   ├── core/            # Database, Redis, FAISS, Embeddings, Gemini & Brain Orchestrator
│   │   ├── models/          # Production SQLAlchemy Models & Pydantic DTOs
│   │   ├── pipeline/        # Instacart ETL Extractors, Sampler, Validator, & Schema Mapper
│   │   └── repositories/    # Product, Session, Bundle, & Analytics Repositories
│   ├── ingest.py            # CLI Data Ingestion & FAISS Vector Builder
│   └── verify_pipeline.py   # 12-Point Automated Performance Verification Suite
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js 15 App Router Views (Home, Search, Product, Dashboard)
│   │   ├── components/      # Glassmorphic UI Components (Header, Footer, BrainPanel, ProductCard)
│   │   ├── hooks/           # Telemetry & Clickstream Hooks
│   │   ├── lib/             # Axios API Client & TypeScript Interfaces
│   │   └── store/           # Zustand State Management
├── docs/                    # Technical Architecture & Pipeline Guides
├── docker-compose.yml       # Multi-container orchestration spec
├── SPRINT_2_GUIDE.md        # Sprint 2 Backend Guide
├── DATA_PIPELINE.md         # Instacart Data Pipeline Documentation
├── FINAL_BACKEND_REPORT.md  # AI Brain Execution & SLA Report
└── README.md                # Project Readme
```

---

## ⚡ Quick Start & Setup

### 1. Docker Compose (Recommended)
```bash
docker-compose up --build
```
- **Frontend Storefront:** `http://localhost:3000`
- **FastAPI Backend:** `http://localhost:8000/docs`

### 2. Local Manual Setup

#### Backend Setup
```bash
cd backend
python -m venv venv
# On Windows: venv\Scripts\activate
# On Linux/macOS: source venv/bin/activate

pip install -r requirements.txt
python verify_pipeline.py
uvicorn app.main:app --reload --port 8000
```

#### Frontend Setup
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

---

## 🔑 Environment Variables Reference

Copy `.env.example` to `.env` in the `backend/` directory:

```ini
# PostgreSQL Connection URL (Neon Cloud or Local)
DATABASE_URL=postgresql://neondb_owner:...@ep-wild-sea-ayxedf4o-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require

# Redis Cache URL
REDIS_URL=redis://localhost:6379/0

# Google Gemini API Key (Optional XAI Natural Language Synthesizer)
GEMINI_API_KEY=your_gemini_api_key_here

# Vector Search Specification
EMBEDDING_MODEL_NAME=sentence-transformers/all-MiniLM-L6-v2
VECTOR_DIMENSION=384
```

---

## 🌐 Key API Endpoints

| Endpoint | Method | Purpose | Latency SLA |
| :--- | :--- | :--- | :--- |
| `/api/v1/brain/analyze` | `POST` | Sequenced multi-agent orchestration & intent trace | **9.73 ms** |
| `/api/v1/recommendations/feed` | `GET` | Top-12 hybrid personalized feed | **18.50 ms** |
| `/api/v1/search/semantic` | `POST` | Dense HNSW FAISS vector search | **2.62 ms** |
| `/api/v1/bundle/{product_id}` | `GET` | Complete the Basket 15% discount bundles | **14.10 ms** |
| `/api/v1/system/health` | `GET` | Live dataset stats & performance SLAs | **4.80 ms** |
| `/api/v1/user/privacy-purge` | `POST` | DPDP Act 2023 right-to-be-forgotten privacy purge | **5.20 ms** |

---

## 👥 Authors & Team CodeX

Built for **AI Build 2026 Hackathon**.
- **Team:** CodeX Intelligence Labs
- **License:** [MIT License](LICENSE)
