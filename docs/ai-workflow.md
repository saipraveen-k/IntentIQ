# IntentIQ AI Workflow & Agent Pipeline Sequence

IntentIQ uses an orchestrated multi-agent pipeline to calculate intent vectors and synthesize explainable recommendations.

```mermaid
sequenceDiagram
    autonumber
    participant Client as Next.js Storefront
    participant Gateway as FastAPI Router
    participant Orchestrator as AI Brain Orchestrator
    participant Agents as AI Agent Sequence
    participant VectorStore as FAISS HNSW Store

    Client->>Gateway: POST /api/v1/brain/analyze
    Gateway->>Orchestrator: Execute Pipeline Sequence
    Orchestrator->>Agents: 1. GuardrailAgent (Validate Payload)
    Orchestrator->>Agents: 2. IntentAgent (Compute Inferred Intent)
    Orchestrator->>VectorStore: 3. SearchAgent (FAISS Nearest Vectors)
    VectorStore-->>Orchestrator: Nearest Vector Candidates
    Orchestrator->>Agents: 4. RecommendationAgent (Hybrid Rerank)
    Orchestrator->>Agents: 5. BundleAgent (Basket Co-Occurrence)
    Orchestrator->>Agents: 6. ExplainabilityAgent (Synthesize XAI Rationale)
    Orchestrator->>Agents: 7. AnalyticsAgent (Log SLA & Latency)
    Orchestrator-->>Gateway: Unified Payload & Trace
    Gateway-->>Client: 200 OK Response
```

## Agent Responsibilities

- **Guardrail Agent:** Validates request parameters and screens input strings against injection patterns.
- **Intent Agent:** Computes active session intent vectors using clickstream dwell time signals.
- **Search Agent:** Queries the FAISS index to retrieve candidate items matching dense vector representations.
- **Recommendation Agent:** Reranks candidate items using a hybrid scoring algorithm combining vector similarity, item ratings, and category diversity metrics.
- **Bundle Agent:** Selects complementary product pairs based on item co-occurrence matrices.
- **Explainability Agent:** Synthesizes clear natural language rationales explaining why items are recommended.
- **Analytics Agent:** Records execution metrics, per-agent latency breakdowns, and audit logs.
