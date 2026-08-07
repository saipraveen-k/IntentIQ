# IntentIQ Production Deployment Guide

This guide details instructions for deploying IntentIQ backend services and Next.js frontend storefronts to production environments.

---

## 1. Production Architecture Overview

In a production environment, IntentIQ is deployed as separate decoupled services:

- **Backend Service:** FastAPI application running on Uvicorn behind a reverse proxy (e.g., Nginx) or managed container service (AWS ECS, Render, Railway, GCP Cloud Run).
- **Frontend Application:** Next.js application deployed to Vercel, Netlify, or containerized Node.js environment.
- **Database:** Managed Cloud PostgreSQL database (e.g., Neon PostgreSQL, AWS RDS).
- **Cache Store:** Managed Redis instance (e.g., Upstash Redis, AWS ElastiCache).

---

## 2. Environment Variables Configuration

Set the following environment variables in your production host environment:

### Backend Variables
```ini
DATABASE_URL=postgresql+asyncpg://<db_user>:<db_password>@<db_host>/<db_name>?sslmode=require
REDIS_URL=redis://:<redis_password>@<redis_host>:<redis_port>/0
GEMINI_API_KEY=your_production_gemini_api_key
SECRET_KEY=your_secure_random_production_secret
EMBEDDING_MODEL_NAME=sentence-transformers/all-MiniLM-L6-v2
VECTOR_DIMENSION=384
```

### Frontend Variables
```ini
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
```

---

## 3. Database Deployment (Neon PostgreSQL)

1. Provision a PostgreSQL instance on [Neon](https://neon.tech) or a preferred cloud provider.
2. Obtain the connection string (`postgresql://...`).
3. Ensure `DATABASE_URL` uses the `postgresql+asyncpg://` protocol prefix for async SQLAlchemy support.
4. IntentIQ auto-creates database tables during application lifespan startup (`init_db()`).

---

## 4. Backend Service Deployment

### Docker Deployment
Build and run the production backend container:

```bash
cd backend
docker build -t intentiq-backend .
docker run -d -p 8000:8000 --env-file .env intentiq-backend
```

### Gunicorn / Uvicorn Execution
For Linux host deployments:

```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

---

## 5. Frontend Application Deployment

### Vercel Deployment (Recommended)
1. Import the repository into Vercel.
2. Set the Root Directory to `frontend`.
3. Configure environment variable: `NEXT_PUBLIC_API_URL`.
4. Deploy.

### Production Build & Standalone Server
To build and serve the production frontend bundle locally or on a VPS:

```bash
cd frontend
npm run build
npm run start
```

---

## 6. Production Deployment Checklist

- [ ] All environment secrets (database passwords, API keys) are configured in secure host secret stores.
- [ ] Database connection pool settings configured appropriately for expected concurrency.
- [ ] CORS headers configured in `app/main.py` matching the production frontend origin domain.
- [ ] Healthcheck endpoint (`GET /api/v1/system/health`) configured in load balancer probes.
- [ ] `faiss_index.bin` vector file persisted or generated during container startup build.
