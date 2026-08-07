from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ProductDTO(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    category: str
    sub_category: Optional[str] = None
    price: float
    original_price: Optional[float] = None
    rating: float = 4.5
    review_count: int = 120
    image_url: str
    attributes: Optional[Dict[str, Any]] = None
    in_stock: bool = True
    xai_explanation: Optional[str] = None
    match_score: Optional[float] = None

class TelemetryEventCreate(BaseModel):
    session_id: str
    event_type: str # CLICK, HOVER, SEARCH, ADD_TO_CART
    product_id: Optional[str] = None
    dwell_time_ms: Optional[int] = 0
    query_text: Optional[str] = None

class FeedResponse(BaseModel):
    session_id: str
    active_intent: str
    intent_confidence: float = 0.88
    products: List[ProductDTO]

class SemanticSearchRequest(BaseModel):
    query: str
    session_id: str
    limit: Optional[int] = 12

class SemanticSearchResponse(BaseModel):
    query: str
    extracted_intents: List[str]
    budget_max: Optional[float] = None
    results: List[ProductDTO]

class BundleResponse(BaseModel):
    base_product_id: str
    base_product: ProductDTO
    complete_the_look: List[ProductDTO]
    frequently_bought_together: List[ProductDTO]
    bundle_discount_pct: float = 15.0
    original_total: float
    discounted_total: float

class GuardrailValidationRequest(BaseModel):
    input_text: str

class GuardrailValidationResponse(BaseModel):
    is_safe: bool
    flag: Optional[str] = "CLEAN"
    sanitized_text: str

class AnalyticsDashboardResponse(BaseModel):
    total_events_processed: int
    active_sessions: int
    avg_faiss_latency_ms: float
    avg_gemini_latency_ms: float
    top_active_intents: List[Dict[str, Any]]

class PrivacyPurgeRequest(BaseModel):
    session_id: str

class PrivacyPurgeResponse(BaseModel):
    session_id: str
    status: str = "PURGED"
    purged_records: int
