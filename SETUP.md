# IntentIQ Local Development Setup Guide

This guide provides step-by-step instructions for installing and running IntentIQ in a local development environment.

---

## Environment Prerequisites

Ensure the following tools are installed on your machine:

- **Node.js:** v18.0.0 or higher
- **Python:** v3.10 or v3.11
- **Git:** Latest release
- **Docker Desktop:** (Optional, for containerized execution)

---

## 1. Repository Setup

Clone the repository to your local machine:

```bash
git clone https://github.com/saipraveen-k/IntentIQ.git
cd IntentIQ
```

---

## 2. Backend Setup

### Create Virtual Environment
```bash
cd backend

# On Linux/macOS:
python3 -m venv venv
source venv/bin/activate

# On Windows:
python -m venv venv
venv\Scripts\activate
```

### Install Dependencies
```bash
pip install -r requirements.txt
```

### Configure Environment Variables
Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

The default configuration uses an in-memory/SQLite database for local zero-config testing:
```ini
DATABASE_URL=sqlite+aiosqlite:///./intentiq.db
REDIS_URL=redis://localhost:6379/0
GEMINI_API_KEY=""
SECRET_KEY=your_local_secret_key
EMBEDDING_MODEL_NAME=sentence-transformers/all-MiniLM-L6-v2
VECTOR_DIMENSION=384
```

---

## 3. Instacart Dataset Setup

IntentIQ includes fallback seeds (`catalog_100.json`). To ingest the raw Instacart dataset:

1. Download the Instacart dataset files (`products.csv`, `departments.csv`, `aisles.csv`, `orders.csv`, `order_products__prior.csv`).
2. Place the CSV files in `datasets/instacart/`.
3. Run the pipeline ingestion CLI:

```bash
python ingest.py --dataset instacart --sample-size 1000
```

---

## 4. Frontend Setup

Open a new terminal window:

```bash
cd frontend
npm install --legacy-peer-deps
```

Create a `.env.local` file (or copy `.env.example`):
```bash
cp .env.example .env.local
```

Ensure `NEXT_PUBLIC_API_URL` points to the running backend API:
```ini
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

## 5. Running the Application

### Option A: Manual Terminal Execution

#### Start Backend (Terminal 1)
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

#### Start Frontend (Terminal 2)
```bash
cd frontend
npm run dev
```

- **Frontend Application:** `http://localhost:3000`
- **FastAPI OpenAPI Documentation:** `http://localhost:8000/docs`

---

### Option B: Docker Compose Execution

You can run the full stack (Frontend, Backend, Redis) using Docker Compose:

```bash
docker-compose up --build
```

To stop containers:
```bash
docker-compose down
```

---

## 6. Verification & Troubleshooting

### Run Verification Suite
Run the automated verification suite to validate database tables, vector indices, and latency SLAs:

```bash
cd backend
python verify_pipeline.py
```

### Common Issues

#### Missing Redis Server
If Redis is not running locally on `localhost:6379`, IntentIQ automatically switches to `InMemoryRedisFallback`. No manual intervention is required.

#### Missing SentenceTransformers Package
If `sentence_transformers` is missing from the environment, IntentIQ uses a deterministic hash embedding fallback to keep vector pipelines functional.

#### Port Conflicts
If port 8000 or 3000 is occupied, specify custom ports:
```bash
# Custom backend port
uvicorn app.main:app --reload --port 8080

# Custom frontend port
npm run dev -- -p 3001
```
