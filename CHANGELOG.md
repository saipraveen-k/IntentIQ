# IntentIQ Release Changelog

All notable changes to the IntentIQ project will be documented in this file.

---

## [1.0.0-HACKATHON] - 2026-08-07

### Added
- **AI Brain Orchestrator:** Unified control plane sequencing all 7 specialized AI agents (`Guardrail`, `Intent`, `Search`, `Recommendation`, `Bundle`, `Explainability`, `Analytics`) with an execution SLA of **9.73ms** (passed sub-1000ms target).
- **Instacart Primary Data Pipeline:** Stream extractor streaming `products.csv`, `departments.csv`, `aisles.csv`, `orders.csv`, and `order_products_prior.csv` for authentic basket evolution timelines.
- **FAISS HNSW Vector Engine:** Precomputed 384-dimensional dense vectors (`sentence-transformers/all-MiniLM-L6-v2`) serialized to `faiss_index.bin` loaded as a singleton instance.
- **Next.js 15 Dark Glassmorphic Storefront:** Apple/Linear design system featuring real-time AI Shopping Brain Control Panel, Personalized Feed with XAI drawers, Command-K Semantic Vector Search, Complete the Basket 15% discount bundles, and AI Operations Center.
- **DPDP Act 2023 Compliance:** Right-To-Be-Forgotten privacy drawer allowing users to flush Redis intent vectors and delete telemetry logs.
- **Neon Cloud PostgreSQL Connection:** Tested and verified live cloud PostgreSQL database setup.
