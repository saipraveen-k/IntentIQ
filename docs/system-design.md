# IntentIQ System Design & Topology

This document details the system design, core modules, and domain interactions of IntentIQ.

## System Topology

```mermaid
flowchart TD
    Client["Client Interface (Next.js 15)"] --> Gateway["API Gateway (FastAPI)"]
    Gateway --> Orchestrator["AI Brain Orchestrator"]

    subgraph Agents ["7 Domain AI Agents"]
        AgentGuard["Guardrail Agent"]
        AgentIntent["Intent Agent"]
        AgentSearch["Search Agent"]
        AgentRecs["Recommendation Agent"]
        AgentBundle["Bundle Agent"]
        AgentXAI["Explainability Agent"]
        AgentAnalytics["Analytics Agent"]
    end

    Orchestrator --> Agents
    Agents --> Persistence["PostgreSQL / Redis / FAISS"]
```

## Data Flow Principles
1. **Event Capture:** User telemetry events (clicks, hovers, search queries) are dispatched to `/api/v1/telemetry/event`.
2. **Intent Calculation:** Intent scores are decayed over time using exponential decay functions to favor recent interactions.
3. **Candidate Recall:** FAISS vector similarity search retrieves Top-K nearest vector candidates.
4. **Scoring & Reranking:** Candidate items are reranked using a hybrid score combining vector distance, popularity ratings, and category diversity weights.
5. **Payload Synthesis:** Rationales are attached to recommended items and returned to the client in a single unified JSON payload.
