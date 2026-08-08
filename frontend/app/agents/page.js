'use client';
import { useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Terminal, 
  Play, 
  Check, 
  AlertCircle,
  Sparkles,
  Layers,
  Cpu,
  Database
} from 'lucide-react';
import AgentCard from '../components/AgentCard';
import FlowDiagram from '../components/FlowDiagram';
import MetricsCard from '../components/MetricsCard';
import TechStack from '../components/TechStack';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const AGENTS = [
  {
    name: 'Session Encoder Agent',
    icon: 'MessageSquare',
    performance: '< 2.5ms',
    description: 'A PyTorch GRU recurrent encoder that processes raw sequences of recent product clicks to model the current user state.',
    technicalDetails: 'GRU, 20 length context, 64-dim output state'
  },
  {
    name: 'Two-Tower Retriever Agent',
    icon: 'Database',
    performance: '< 1.0ms',
    description: 'Queries a multi-million-dimensional vector space using cosine distance calculations matching user session embeddings to catalog items.',
    technicalDetails: 'PyTorch Two-Tower, FAISS IVF-PQ Index'
  },
  {
    name: 'Multi-Task NCF Scorer Agent',
    icon: 'Layers',
    performance: '< 5.0ms',
    description: 'Predicts three independent action heads: click probability, add-to-cart probability, and purchase probability.',
    technicalDetails: '3-Layer MLP (512 -> 256 -> 128) with 3 Sigmoid heads'
  },
  {
    name: 'Cross-Encoder Reranker Agent',
    icon: 'Cpu',
    performance: '< 15.0ms',
    description: 'Processes query-product strings directly using self-attention to calculate deep semantic relevance before presenting final results.',
    technicalDetails: 'MiniLM-L6 reranker, parallel timeout guard'
  },
  {
    name: 'Fallback Router Agent',
    icon: 'Shield',
    performance: '< 1.0ms',
    description: 'A keyword intent fallback router that detects broad expressions (e.g. organic, protein) to retrieve popular items from category indices.',
    technicalDetails: 'Keyword-to-Department Trie matching'
  },
  {
    name: 'Association Miner Agent',
    icon: 'Percent',
    performance: '< 2.0ms',
    description: 'Mines frequent itemsets from prior user order baskets to recommend complementary items for completing current look.',
    technicalDetails: 'Apriori FP-Growth rule dictionary'
  },
  {
    name: 'Guardrail & Explainability Agent',
    icon: 'CheckCircle2',
    performance: '< 1.5ms',
    description: 'Applies category caps (diversity limit <=35%) and outputs explainability badges by matching user session items to candidate classes.',
    technicalDetails: 'Maximum 7 products per department cap'
  }
];

const METRICS = [
  { label: 'Feed Latency', value: '8ms', change: '< 10ms SLA', changeType: 'increase', description: 'Session prediction with Two-Tower FAISS + NCF' },
  { label: 'Search Latency', value: '25ms', change: '< 30ms SLA', changeType: 'increase', description: 'Retrieval + MiniLM semantic reranking' },
  { label: 'Products Indexed', value: '5,000', change: 'Top Catalog', changeType: 'increase', description: 'FAISS index size filtered by frequency' },
  { label: 'CTR Lift (Offline)', value: '+59%', change: '+25% Target', changeType: 'increase', description: 'Relative to baseline frequency recommenders' },
  { label: 'AOV Lift (Offline)', value: '+34%', change: '+12% Target', changeType: 'increase', description: 'Due to complementary bundle rules' },
  { label: 'Search Abandonment', value: '-36%', change: '-30% Target', changeType: 'decrease', description: 'Due to broad fallback query matching' }
];

const MOCK_API_JSONS = {
  feed: {
    endpoint: '/api/v1/recommendations/feed',
    request: { user_id: 12345, session_history: [] },
    response: {
      recommendations: [
        { product_id: 8103, name: "Dairy Free Slices Provolone Cheese Alternative", department: "dairy eggs", price: 6.30, reason: "🔥 High match for preferences" },
        { product_id: 25093, name: "Colby Jack Cheese", department: "dairy eggs", price: 5.35, reason: "⭐ Highly recommended pick" }
      ]
    }
  },
  search: {
    endpoint: '/api/v1/search/semantic',
    request: { query: "fresh", user_id: 12345 },
    response: {
      results: [
        { product_id: 47209, name: "Organic Hass Avocado", department: "produce", price: 8.20, score: 0.5174, reason: "🔥 Popular in produce" }
      ],
      latency_ms: 25.31,
      fallback: true,
      fallback_reason: "Showing popular items in relevant aisles for 'fresh'"
    }
  },
  bundle: {
    endpoint: '/api/v1/bundle',
    request: { product_id: 47209 },
    response: {
      base_product_id: 47209,
      bundle_items: [
        { product_id: 13176, name: "Bag of Organic Bananas", price: 9.77, department: "produce", reason: "Frequently bought together" }
      ],
      original_total: 43.79,
      discounted_total: 37.22,
      savings: 6.57
    }
  }
};

export default function AgentsPage() {
  const [activeTab, setActiveTab] = useState('feed');
  const [loading, setLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState(MOCK_API_JSONS.feed.response);
  const [apiError, setApiError] = useState(false);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setApiResponse(MOCK_API_JSONS[tab].response);
    setApiError(false);
  };

  const handleLiveTest = async () => {
    setLoading(true);
    setApiError(false);
    
    const endpointConfig = MOCK_API_JSONS[activeTab];
    try {
      const response = await axios.post(`${API_URL}${endpointConfig.endpoint}`, endpointConfig.request);
      setApiResponse(response.data);
    } catch (err) {
      console.error(err);
      setApiError(true);
      setApiResponse(endpointConfig.response); // Fallback to mock logs
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-12">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-100 shadow-sm blur-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <Link 
              href="/"
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-slate-800 flex items-center gap-1 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Store
            </Link>
            <div className="w-px h-6 bg-slate-200"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md">
                <Sparkles className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-sm font-extrabold text-slate-800">IntentIQ Console</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Banner */}
        <section className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-3xl p-8 md:p-12 text-white mb-8 shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="relative z-10 max-w-3xl">
            <span className="text-xs bg-white/10 text-indigo-100 border border-white/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              System Architecture Walkthrough
            </span>
            <h1 className="text-3xl md:text-5xl font-black mt-4 leading-tight">
              How IntentIQ Works: <br />AI Agents in Action
            </h1>
            <p className="text-sm md:text-base text-indigo-100 mt-3 leading-relaxed">
              Explore the multi-stage neural pipeline that compiles Instacart baskets, executes FAISS search retrieval, reranks query vectors using Cross-Encoders, and applies safety guardrails in milliseconds.
            </p>
          </div>
        </section>

        {/* Pipeline Diagram Component */}
        <FlowDiagram />

        {/* Key Benchmarks Metrics */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h3 className="font-extrabold text-slate-800 text-base">Key Benchmarks & Business Targets</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {METRICS.map((metric) => (
              <MetricsCard key={metric.label} metric={metric} />
            ))}
          </div>
        </section>

        {/* Agent Cards Grid */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-5 h-5 text-indigo-600" />
            <h3 className="font-extrabold text-slate-800 text-base">AI Pipeline Stage Agents</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {AGENTS.map((agent) => (
              <AgentCard key={agent.name} agent={agent} />
            ))}
          </div>
        </section>

        {/* Technologies Showcase */}
        <TechStack />

        {/* Interactive Code Playground / Sandbox */}
        <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">API Live Sandbox Playground</h3>
                <p className="text-slate-400 text-xs mt-0.5">Test real API payloads and structural bindings</p>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button 
                onClick={handleLiveTest}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                Test Live Call
              </button>
            </div>
          </div>

          {/* Sandbox Tabs */}
          <div className="flex border-b border-slate-100 mb-4">
            <button 
              onClick={() => handleTabChange('feed')}
              className={`px-4 py-2 text-xs font-bold transition-all border-b-2 ${
                activeTab === 'feed' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400'
              }`}
            >
              Feed API (/feed)
            </button>
            <button 
              onClick={() => handleTabChange('search')}
              className={`px-4 py-2 text-xs font-bold transition-all border-b-2 ${
                activeTab === 'search' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400'
              }`}
            >
              Search API (/search)
            </button>
            <button 
              onClick={() => handleTabChange('bundle')}
              className={`px-4 py-2 text-xs font-bold transition-all border-b-2 ${
                activeTab === 'bundle' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400'
              }`}
            >
              Bundle API (/bundle)
            </button>
          </div>

          {/* Warning Banner */}
          {apiError && (
            <div className="mb-4 p-3.5 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2.5 text-xs text-amber-700 font-semibold shadow-sm">
              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <span>Backend server is offline or unreachable. Displaying cached system response logs.</span>
            </div>
          )}

          {/* Code Viewer Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Request Body</span>
              <pre className="bg-slate-900 text-slate-200 p-4 rounded-2xl text-xs overflow-x-auto border border-slate-800 font-mono shadow-inner max-h-[300px]">
                {JSON.stringify(MOCK_API_JSONS[activeTab].request, null, 2)}
              </pre>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Response Data</span>
              <pre className="bg-slate-900 text-indigo-300 p-4 rounded-2xl text-xs overflow-x-auto border border-slate-800 font-mono shadow-inner max-h-[300px] no-scrollbar">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
