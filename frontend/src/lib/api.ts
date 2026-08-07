import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export interface Product {
  id: str;
  title: string;
  description?: string;
  category: string;
  sub_category?: string;
  price: number;
  original_price?: number;
  rating: number;
  review_count: number;
  image_url: string;
  attributes?: Record<string, any>;
  in_stock: boolean;
  xai_explanation?: string;
  match_score?: number;
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
  bundle_discount_pct: number;
  original_total: number;
  discounted_total: number;
}

export interface AnalyticsResponse {
  total_events_processed: number;
  active_sessions: number;
  avg_faiss_latency_ms: number;
  avg_gemini_latency_ms: number;
  top_active_intents: Array<{ intent: string; count: number }>;
}

export const api = {
  // Telemetry Event
  recordEvent: async (sessionId: string, eventType: string, productId?: string, dwellMs?: number, queryText?: string) => {
    return apiClient.post('/telemetry/event', {
      session_id: sessionId,
      event_type: eventType,
      product_id: productId,
      dwell_time_ms: dwellMs || 0,
      query_text: queryText,
    });
  },

  // Home Feed
  getPersonalizedFeed: async (sessionId: string, limit: number = 20) => {
    const res = await apiClient.get<FeedResponse>('/recommendations/feed', {
      params: { session_id: sessionId, limit },
    });
    return res.data;
  },

  // Semantic Search
  searchSemantic: async (query: string, sessionId: string) => {
    const res = await apiClient.post<SemanticSearchResponse>('/search/semantic', {
      query,
      session_id: sessionId,
    });
    return res.data;
  },

  // Product Bundle
  getBundle: async (productId: string) => {
    const res = await apiClient.get<BundleResponse>(`/bundle/${productId}`);
    return res.data;
  },

  // AI Ops Metrics
  getAnalytics: async () => {
    const res = await apiClient.get<AnalyticsResponse>('/analytics/dashboard');
    return res.data;
  },

  // Privacy Purge
  purgePrivacyData: async (sessionId: string) => {
    const res = await apiClient.post('/user/privacy-purge', { session_id: sessionId });
    return res.data;
  },

  // Guardrail Validation
  validateGuardrail: async (inputText: string) => {
    const res = await apiClient.post('/guardrails/validate', { input_text: inputText });
    return res.data;
  }
};
