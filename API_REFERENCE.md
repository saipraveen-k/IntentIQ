# IntentIQ API Reference Specification

This document details the REST API specifications for the IntentIQ backend engine.

Base API Endpoint URL: `/api/v1`

---

## Endpoint Summary Table

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| [`/brain/analyze`](#1-post-apiv1brainanalyze) | `POST` | Executes complete multi-agent intent and recommendation sequence |
| [`/recommendations/feed`](#2-get-apiv1recommendationsfeed) | `GET` | Retrieves personalized product recommendation feed |
| [`/search/semantic`](#3-post-apiv1searchsemantic) | `POST` | Executes dense vector similarity search |
| [`/bundle/{id}`](#4-get-apiv1bundleid) | `GET` | Retrieves bundle recommendations for a target product |
| [`/system/health`](#5-get-apiv1systemhealth) | `GET` | Returns system health, dataset status, and SLA metrics |
| [`/analytics/dashboard`](#6-get-apiv1analyticsdashboard) | `GET` | Returns telemetry metrics and session analytics |
| `/telemetry/event` | `POST` | Records user interaction events (clicks, hovers, search) |
| `/user/privacy-purge` | `POST` | Flushes active user session telemetry and intent vectors |

---

## 1. POST `/api/v1/brain/analyze`

Executes the single-pass multi-agent orchestration sequence to update session intent, retrieve vector candidates, generate product recommendations, select bundles, and compute XAI rationales.

### Request Headers
```
Content-Type: application/json
```

### Request Body Schema
```json
{
  "session_id": "string",
  "limit": 10
}
```

### Response Schema (Status `200 OK`)
```json
{
  "status": "success",
  "session_id": "string",
  "intent": {
    "active_label": "string",
    "confidence": 0.94,
    "history_timeline": [
      {
        "timestamp": "string",
        "event_type": "string",
        "intent_label": "string",
        "confidence": 0.88
      }
    ]
  },
  "recommendations": [
    {
      "id": "string",
      "title": "string",
      "category": "string",
      "sub_category": "string",
      "price": 12.99,
      "rating": 4.8,
      "review_count": 320,
      "image_url": "string",
      "match_score": 0.96,
      "xai_explanation": "string"
    }
  ],
  "latency": {
    "TotalExecutionTime": 12.24,
    "IntentAgent": 1.20,
    "RecommendationAgent": 4.50,
    "ExplainabilityAgent": 5.10
  }
}
```

---

## 2. GET `/api/v1/recommendations/feed`

Retrieves a personalized product recommendation feed for a specified user session.

### Query Parameters
- `session_id` (string, optional): Session identifier (default: `"sess_demo_101"`).
- `limit` (integer, optional): Number of items to return (default: `12`).

### Response Schema (Status `200 OK`)
```json
{
  "session_id": "sess_demo_101",
  "active_intent": "Fresh Produce & Pantry",
  "total": 12,
  "products": [
    {
      "id": "prod_101",
      "title": "Organic Bananas",
      "category": "Fresh Produce",
      "sub_category": "Fresh Fruits",
      "price": 3.99,
      "rating": 4.9,
      "review_count": 1250,
      "image_url": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600",
      "match_score": 0.98,
      "xai_explanation": "Matches your active Fresh Produce shopping signals."
    }
  ]
}
```

---

## 3. POST `/api/v1/search/semantic`

Executes dense vector similarity search against the FAISS vector index using natural language queries.

### Request Body Schema
```json
{
  "session_id": "string",
  "query": "healthy breakfast items under 500",
  "limit": 10
}
```

### Response Schema (Status `200 OK`)
```json
{
  "query": "healthy breakfast items under 500",
  "extracted_intents": ["Healthy", "Breakfast"],
  "budget_max": 500.0,
  "total": 8,
  "results": [
    {
      "id": "prod_204",
      "title": "Whole Grain Oats",
      "category": "Pantry",
      "price": 249.00,
      "match_score": 0.94
    }
  ]
}
```

---

## 4. GET `/api/v1/bundle/{id}`

Retrieves complementary "Complete the Basket" product bundles and frequently-bought-together items for a target product.

### Path Parameters
- `id` (string, required): Target product ID.

### Response Schema (Status `200 OK`)
```json
{
  "base_product": {
    "id": "prod_101",
    "title": "Organic Bananas",
    "price": 3.99
  },
  "frequently_bought_together": [
    {
      "id": "prod_105",
      "title": "Organic Whole Milk",
      "price": 4.49
    }
  ],
  "complete_the_look": [
    {
      "id": "prod_108",
      "title": "Organic Strawberries",
      "price": 5.99
    }
  ],
  "bundle_discount_pct": 15.0
}
```

---

## 5. GET `/api/v1/system/health`

Returns operational status, database statistics, vector index counts, and latency SLA metrics.

### Response Schema (Status `200 OK`)
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "dataset": {
    "active_provider": "Instacart",
    "detected": true
  },
  "database": {
    "products_count": 1000,
    "categories_count": 21,
    "brands_count": 134,
    "sessions_count": 5000
  },
  "faiss": {
    "initialized": true,
    "indexed_vectors": 1000
  },
  "performance_metrics": {
    "avg_ai_brain_latency_ms": 11.27,
    "avg_search_latency_ms": 2.63,
    "avg_recommendation_latency_ms": 18.50
  }
}
```

---

## Error Response Format

All API errors return a standard JSON payload:

```json
{
  "detail": "Error description message."
}
```

### Common HTTP Status Codes
- `200 OK`: Request processed successfully.
- `202 Accepted`: Asynchronous event/telemetry payload accepted.
- `400 Bad Request`: Invalid payload parameters.
- `404 Not Found`: Requested resource ID not found.
- `500 Internal Server Error`: Server exception encountered.
