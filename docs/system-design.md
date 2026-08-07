# IntentIQ System Design & Topology

This document details the system design, core modules, and domain interactions of IntentIQ.

## System Topology

```mermaid
flowchart TB
    subgraph Client ["Client Interface (Next.js 15)"]
        UI["Storefront UI"]
        Dashboard["AI Operations Dashboard"]
    end

    subgraph Gateway ["API Layer (FastAPI Routers)"]
        Router["REST Endpoint Router (/api/v1/*)"]
    end

    subgraph Engine ["AI Brain Engine"]
        Orchestrator["AI Brain Orchestrator"]
        
        subgraph Agents ["7-Agent Execution Sequence"]
            A1["1. Guardrail"] --> A2["2. Intent"]
            A2 --> A3["3. Search"]
            A3 --> A4["4. Recommendation"]
            A4 --> A5["5. Bundle"]
            A5 --> A6["6. Explainability"]
            A6 --> A7["7. Analytics"]
        end
    end

    subgraph Data ["Data & Vector Storage"]
        DB[("PostgreSQL / SQLite")]
        Cache[("Redis Session Cache")]
        VectorStore[("FAISS HNSW Index")]
    end

    Client -- "User Events / Telemetry" --> Gateway
    Gateway --> Orchestrator
    Orchestrator --> Agents
    Agents <--> Data
    Agents -- "Unified Payload" --> Client
```

## Data Flow Principles
1. **Event Capture:** User telemetry events (clicks, hovers, search queries) are dispatched to `/api/v1/telemetry/event`.
2. **Intent Calculation:** Intent scores are decayed over time using exponential decay functions to favor recent interactions.
3. **Candidate Recall:** FAISS vector similarity search retrieves Top-K nearest vector candidates.
4. **Scoring & Reranking:** Candidate items are reranked using a hybrid score combining vector distance, popularity ratings, and category diversity weights.
5. **Payload Synthesis:** Rationales are attached to recommended items and returned to the client in a single unified JSON payload.
