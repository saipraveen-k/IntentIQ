import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export interface ScoreBreakdown {
  semantic: number;
  graph: number;
  intent: number;
  budget: number;
  popularity: number;
  diversity_bonus: number;
  novelty_bonus: number;
  final_score: number;
}

export interface DecisionTrace {
  similarity: number;
  basket_affinity: number;
  persona_match: string;
  budget_match: string;
  diversity_bonus_applied: boolean;
  final_rank: number;
  final_score: number;
}

export interface StructuredXAI {
  primary_reason: string;
  confidence: number;
  supporting_signals: string[];
  intent_label: string;
  decision_trace?: DecisionTrace;
}

export interface Product {
  id: string;
  title: string;
  description?: string;
  category: string;
  brand?: string;
  sub_category?: string;
  price: number;
  original_price?: number;
  rating: number;
  review_count: number;
  image_url: string;
  attributes?: Record<string, any>;
  in_stock: boolean;
  xai_explanation?: string;
  structured_xai?: StructuredXAI;
  match_score?: number;
  score_breakdown?: ScoreBreakdown;
}

export interface BrainAnalyzeResponse {
  session_id: string;
  guardrail_status: string;
  intent: {
    active_label: string;
    confidence: number;
    history_timeline: Array<{
      timestamp: string;
      event_type: string;
      intent_label: string;
      confidence: number;
    }>;
  };
  recommendations: Product[];
  bundles: {
    base_product_id?: string;
    complete_the_look?: string[];
    frequently_bought_together?: string[];
    bundle_discount_pct?: number;
    discounted_total?: number;
  };
  search_results: Product[];
  explanations: Array<{
    product_id: string;
    product_title: string;
    explanation: string;
    match_score: number;
  }>;
  analytics: Record<string, any>;
  latency: Record<string, number>;
  agent_trace: Array<{
    agent: string;
    status: string;
    latency_ms: number;
    [key: string]: any;
  }>;
}

export interface FeedResponse {
  session_id: string;
  active_intent: string;
  intent_confidence: number;
  products: Product[];
}

export interface SemanticSearchResponse {
  query: string;
  extracted_intents: string[];
  budget_max?: number;
  results: Product[];
}

export interface BundleResponse {
  base_product_id: string;
  base_product: Product;
  complete_the_look: Product[];
  frequently_bought_together: Product[];
  substitutes?: Product[];
  premium_alternatives?: Product[];
  healthy_alternatives?: Product[];
  bundle_discount_pct: number;
  original_total: number;
  discounted_total: number;
}

export interface OfflineMetrics {
  precision_at_5: number;
  precision_at_10: number;
  recall_at_10: number;
  map_score: number;
  mrr_score: number;
  ndcg_at_10: number;
  catalog_coverage_pct: number;
  category_diversity_index: number;
  novelty_score: number;
  intra_list_diversity: number;
}

export interface OnlineMetrics {
  ctr_pct: number;
  cart_conversion_rate_pct: number;
  bundle_acceptance_rate_pct: number;
  avg_recommendation_latency_ms: number;
  avg_search_latency_ms: number;
  avg_brain_latency_ms: number;
  est_avg_revenue_per_session: number;
}

export interface SystemHealthResponse {
  status: string;
  dataset: Record<string, any>;
  embeddings: Record<string, any>;
  faiss: Record<string, any>;
  recommendation_engine: Record<string, any>;
  performance_metrics: Record<string, any>;
  database: Record<string, any>;
  redis: Record<string, any>;
  gemini: Record<string, any>;
  ai_agents: Record<string, string>;
}

// API Client Methods
export const api = {
  analyzeBrain: async (sessionId: string, query?: string, clickedProducts?: string[]): Promise<BrainAnalyzeResponse> => {
    const res = await apiClient.post<BrainAnalyzeResponse>('/brain/analyze', {
      session_id: sessionId,
      search_query: query,
      clicked_products: clickedProducts,
    });
    return res.data;
  },

  switchPersona: async (sessionId: string, persona: string) => {
    const res = await apiClient.post('/brain/persona', {
      session_id: sessionId,
      persona: persona,
    });
    return res.data;
  },

  getFeed: async (sessionId: string, limit: number = 10): Promise<FeedResponse> => {
    const res = await apiClient.get<FeedResponse>('/recommendations/feed', {
      params: { session_id: sessionId, limit },
    });
    return res.data;
  },

  searchSemantic: async (sessionId: string, query: string, limit: number = 12): Promise<SemanticSearchResponse> => {
    const res = await apiClient.post<SemanticSearchResponse>('/search/semantic', {
      session_id: sessionId,
      query,
      limit,
    });
    return res.data;
  },

  getBundle: async (productId: string): Promise<BundleResponse> => {
    const res = await apiClient.get<BundleResponse>(`/bundle/${productId}`);
    return res.data;
  },

  sendTelemetry: async (sessionId: string, eventType: string, productId?: string, dwellTimeMs?: number, queryText?: string) => {
    const res = await apiClient.post('/telemetry/event', {
      session_id: sessionId,
      event_type: eventType,
      product_id: productId,
      dwell_time_ms: dwellTimeMs,
      query_text: queryText,
    });
    return res.data;
  },

  getSystemHealth: async (): Promise<SystemHealthResponse> => {
    const res = await apiClient.get<SystemHealthResponse>('/system/health');
    return res.data;
  },

  getAnalyticsDashboard: async () => {
    const res = await apiClient.get('/analytics/dashboard');
    return res.data;
  },

  purgePrivacyData: async (sessionId: string) => {
    const res = await apiClient.post('/user/privacy-purge', { session_id: sessionId });
    return res.data;
  },
};

