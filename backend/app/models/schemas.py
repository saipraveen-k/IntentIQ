from pydantic import BaseModel, Field, model_validator
from typing import List, Optional, Dict, Any

class ComponentScoreBreakdown(BaseModel):
    semantic: float = 0.0
    graph: float = 0.0
    intent: float = 0.0
    budget: float = 0.0
    popularity: float = 0.0
    diversity_bonus: float = 0.0
    novelty_bonus: float = 0.0
    final_score: float = 0.0

class RecommendationDecisionTrace(BaseModel):
    similarity: float = 0.0
    basket_affinity: float = 0.0
    persona_match: str = "Matched"
    budget_match: str = "Compatible"
    diversity_bonus_applied: bool = True
    final_rank: int = 1
    final_score: float = 0.0

class StructuredXAIExplanation(BaseModel):
    primary_reason: str
    confidence: int = 90
    supporting_signals: List[str]
    intent_label: str = "Discovery"
    decision_trace: Optional[RecommendationDecisionTrace] = None

class ProductDTO(BaseModel):
    id: str
    title: str
    product_id: Optional[int] = None
    name: Optional[str] = None
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
    structured_xai: Optional[StructuredXAIExplanation] = None
    match_score: Optional[float] = None
    score_breakdown: Optional[ComponentScoreBreakdown] = None

    @model_validator(mode="after")
    def populate_legacy_fields(self):
        if self.product_id is None:
            try:
                numeric_id = "".join(filter(str.isdigit, self.id))
                self.product_id = int(numeric_id) if numeric_id else 0
            except Exception:
                self.product_id = 0
        if self.name is None:
            self.name = self.title
        return self

class TelemetryEventCreate(BaseModel):
    session_id: str
    event_type: str # CLICK, HOVER, SEARCH, ADD_TO_CART, WISHLIST, PURCHASE
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
    session_id: Optional[str] = "default_session"
    limit: Optional[int] = 12
    user_id: Optional[str] = None

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
    substitutes: Optional[List[ProductDTO]] = []
    premium_alternatives: Optional[List[ProductDTO]] = []
    healthy_alternatives: Optional[List[ProductDTO]] = []
    bundle_discount_pct: float = 15.0
    original_total: float
    discounted_total: float

class GuardrailValidationRequest(BaseModel):
    input_text: str

class GuardrailValidationResponse(BaseModel):
    is_safe: bool
    flag: Optional[str] = "CLEAN"
    sanitized_text: str

class OfflineMetricsDTO(BaseModel):
    precision_at_5: float = 0.84
    precision_at_10: float = 0.78
    recall_at_10: float = 0.82
    map_score: float = 0.76
    mrr_score: float = 0.81
    ndcg_at_10: float = 0.85
    catalog_coverage_pct: float = 94.2
    category_diversity_index: float = 0.88
    novelty_score: float = 0.72
    intra_list_diversity: float = 0.81

class OnlineMetricsDTO(BaseModel):
    ctr_pct: float = 14.8
    cart_conversion_rate_pct: float = 8.4
    bundle_acceptance_rate_pct: float = 22.1
    avg_recommendation_latency_ms: float = 18.5
    avg_search_latency_ms: float = 34.2
    avg_brain_latency_ms: float = 112.4
    est_avg_revenue_per_session: float = 485.50

class AnalyticsDashboardResponse(BaseModel):
    total_events_processed: int
    active_sessions: int
    avg_faiss_latency_ms: float
    avg_gemini_latency_ms: float
    top_active_intents: List[Dict[str, Any]]
    offline_metrics: Optional[OfflineMetricsDTO] = None
    online_metrics: Optional[OnlineMetricsDTO] = None
    conversion_funnel: Optional[Dict[str, int]] = None
    top_bundle_pairs: Optional[List[Dict[str, Any]]] = None

class PrivacyPurgeRequest(BaseModel):
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    confirm_purge: Optional[bool] = True

class PrivacyPurgeResponse(BaseModel):
    session_id: str
    status: str = "PURGED"
    purged_records: int

class PersonaSwitchRequest(BaseModel):
    session_id: str
    persona: str # healthy, student, luxury, family, fitness, budget, weekend

class PersonaSwitchResponse(BaseModel):
    session_id: str
    persona: str
    status: str = "ACTIVE"
    active_intent_label: str
    intent_confidence: float

