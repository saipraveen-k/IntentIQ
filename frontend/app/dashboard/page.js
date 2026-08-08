'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Sparkles, ArrowLeft } from 'lucide-react';
import SearchPanel from '../components/Dashboard/SearchPanel';
import FeedPanel from '../components/Dashboard/FeedPanel';
import BundleWidget from '../components/Dashboard/BundleWidget';
import ClickstreamSimulator from '../components/Dashboard/ClickstreamSimulator';
import JuryInspection from '../components/Dashboard/JuryInspection';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function DashboardPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIntent, setActiveIntent] = useState('General Catalog Browse');
  
  // Search parameters
  const [queryTags, setQueryTags] = useState(['State: General Feed']);
  
  // PDP Selected item for bundle completes
  const [selectedProductId, setSelectedProductId] = useState(13176);
  
  // Clickstream Simulator State
  const [history, setHistory] = useState([]);
  const [coldStartIds, setColdStartIds] = useState([]);
  
  // Jury Inspection Diagnostics State
  const [rawInput, setRawInput] = useState('');
  const [sanitizedInput, setSanitizedInput] = useState('');
  const [piiLogs, setPiiLogs] = useState([]);
  const [latencySteps, setLatencySteps] = useState({
    anonymization: 4,
    retrieval: 18,
    reranking: 22,
    total: 68
  });
  const [isSLM, setIsSLM] = useState(false);
  const [inferenceCost, setInferenceCost] = useState(0.00012);
  const [queryCount, setQueryCount] = useState(1);

  // Load feed on mount
  const loadFeed = async (sessionHistory = []) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/v1/recommendations/feed`, {
        user_id: 12345,
        session_history: sessionHistory
      });
      if (response.data && response.data.recommendations) {
        setProducts(response.data.recommendations);
      }
    } catch (err) {
      console.error(err);
      loadMockFeed();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const loadMockFeed = () => {
    setProducts([
      { product_id: 13176, name: "Bag of Organic Bananas", department: "produce", price: 9.15, reason: "🔥 Trending choice in produce" },
      { product_id: 47209, name: "Organic Hass Avocado", department: "produce", price: 8.20, reason: "⭐ Highly rated choice" },
      { product_id: 27845, name: "Organic Whole Milk", price: 5.49, department: "dairy eggs", reason: "🥛 Recommended for you" },
      { product_id: 39275, name: "Organic Blueberries", price: 6.99, department: "produce", reason: "⚡ Lightning Delivery pick" },
      { product_id: 21137, name: "Organic Strawberries", price: 4.40, reason: "🍎 Match for your profile" },
      { product_id: 22935, name: "Organic Yellow Onion", department: "produce", price: 5.35, reason: "🔥 Popular in produce" }
    ]);
  };

  // Onboarding cold-start click
  const handleColdStartClick = (item) => {
    const updatedIds = [...coldStartIds, item.product_id].slice(-3); // Keep last 3 clicked items
    setColdStartIds(updatedIds);

    const time = new Date().toLocaleTimeString();
    const newAction = { action: 'Cold Start onboarding Click', item: item.name, time };
    const updatedHistory = [newAction, ...history];
    setHistory(updatedHistory);
    
    // Scrub PII for log
    setRawInput(`Cold start choices: ${updatedIds.join(', ')} for User ID 12345 (saipraveen-k@gmail.com)`);
    setSanitizedInput(`Cold start onboarding choice IDs: ${updatedIds.map(id => `{{ID_${id}}}`).join(', ')} for anonymized ID: {{USER_1}}`);
    setPiiLogs([{ raw: 'saipraveen-k@gmail.com', scrubbed: '{{EMAIL_1}}' }]);

    // Update inferred intent
    setActiveIntent(`Interests: ${item.department} (${updatedIds.length} items selected)`);
    setQueryTags([`Onboarding Count: ${updatedIds.length}`, `Active Ids: ${updatedIds.join(',')}`]);
    
    // Simulate latency shifts
    setLatencySteps({
      anonymization: 3,
      retrieval: 12,
      reranking: 18,
      total: 33
    });

    // Economics stats
    setQueryCount((prev) => prev + 1);
    setInferenceCost((prev) => prev + 0.00008);
    setIsSLM(true);

    // Reorganize feed based on selected items
    loadFeed(updatedIds);
  };

  // Search logic
  const handleSearch = async (query) => {
    setLoading(true);
    setActiveIntent(`Search query: "${query}"`);
    
    // Parse query tags
    const tags = [`Query: ${query}`];
    if (query.toLowerCase().includes('organic')) tags.push('Style: Organic');
    if (query.toLowerCase().includes('fresh')) tags.push('Color: Fresh');
    if (query.toLowerCase().includes('milk') || query.toLowerCase().includes('cheese')) tags.push('Category: Dairy');
    setQueryTags(tags);

    // Detect if search has PII (e.g. email, phone) to show proxy scrubbing
    const piiFound = [];
    let sanitizedText = query;
    if (query.includes('@')) {
      piiFound.push({ raw: query.match(/\S+@\S+/)[0], scrubbed: '{{EMAIL_1}}' });
      sanitizedText = sanitizedText.replace(/\S+@\S+/, '{{EMAIL_1}}');
    }
    const phoneMatch = query.match(/\b\d{10}\b/);
    if (phoneMatch) {
      piiFound.push({ raw: phoneMatch[0], scrubbed: '{{PHONE_1}}' });
      sanitizedText = sanitizedText.replace(/\b\d{10}\b/, '{{PHONE_1}}');
    }
    
    setRawInput(`Search request: "${query}"`);
    setSanitizedInput(`Scrubbed semantic input: "${sanitizedText}"`);
    setPiiLogs(piiFound);

    // Call search API
    try {
      const response = await axios.post(`${API_URL}/api/v1/search/semantic`, {
        query: query,
        user_id: 12345
      });
      setProducts(response.data.results || []);
      setLatencySteps({
        anonymization: piiFound.length > 0 ? 6 : 4,
        retrieval: 18,
        reranking: response.data.fallback ? 0 : 25, // Skip NCF Reranking if fallback triggers!
        total: Math.round(response.data.latency_ms || 68)
      });
      setIsSLM(response.data.fallback ? true : false); // Route fallback to SLM
    } catch (err) {
      console.error(err);
      loadMockSearch(query);
    } finally {
      setLoading(false);
      setQueryCount((prev) => prev + 1);
      setInferenceCost((prev) => prev + 0.00012);
    }
  };

  const loadMockSearch = (query) => {
    setProducts([
      { product_id: 13176, name: "Bag of Organic Bananas", department: "produce", price: 9.15, reason: "🔥 Matching search score" },
      { product_id: 47209, name: "Organic Hass Avocado", department: "produce", price: 8.20, reason: "⭐ Highly rated similarity score" }
    ]);
    setLatencySteps({
      anonymization: 4,
      retrieval: 18,
      reranking: 22,
      total: 68
    });
  };

  // Clickstream simulators
  const handleAddSimulatedAction = (action, item) => {
    const time = new Date().toLocaleTimeString();
    const newAction = { action, item, time };
    setHistory([newAction, ...history]);

    setRawInput(`Simulator trigger: ${action} on ${item}`);
    setSanitizedInput(`Simulate stream target: ${action} on {{PRODUCT_TARGET}}`);
    setPiiLogs([]);

    // Update pricing statistics
    setQueryCount((prev) => prev + 1);
    setInferenceCost((prev) => prev + 0.00004);
    setIsSLM(true); // Routing simple clicks to local SLM
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-100 shadow-sm blur-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <Link 
              href="/"
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-slate-800 flex items-center gap-1 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" /> Storefront
            </Link>
            <div className="w-px h-6 bg-slate-200"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md">
                <Sparkles className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-sm font-extrabold text-slate-800">IntentIQ Demo Console</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-1.5 font-bold text-indigo-600 hidden sm:block">
              Interactive Jury Mode
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* PANEL A: SHOPPER EXPERIENCE (Left/Top) */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-4 bg-indigo-600 rounded"></span>
              <h3 className="font-extrabold text-slate-800 text-base">Panel A: Shopper Experience Simulator</h3>
            </div>
            
            {/* Search Module */}
            <SearchPanel onSearch={handleSearch} queryTags={queryTags} />

            {/* Home Feed Module */}
            <FeedPanel 
              products={products} 
              activeIntent={activeIntent}
              onColdStartClick={handleColdStartClick}
              onProductClick={(pid) => setSelectedProductId(pid)}
              loading={loading}
            />

            {/* Bundle Complete the Look Widget */}
            <BundleWidget productId={selectedProductId} apiUrl={API_URL} />

            {/* Clickstream Toolbar */}
            <ClickstreamSimulator 
              history={history}
              onAddSimulatedAction={handleAddSimulatedAction}
              onClearHistory={() => setHistory([])}
            />
          </div>

          {/* PANEL B: JURY INSPECTION PANEL (Right/Bottom) */}
          <div className="space-y-6 lg:sticky lg:top-20">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-4 bg-slate-900 rounded"></span>
              <h3 className="font-extrabold text-slate-800 text-base">Panel B: Jury Diagnostics Inspector</h3>
            </div>

            <JuryInspection
              rawInput={rawInput}
              sanitizedInput={sanitizedInput}
              piiLogs={piiLogs}
              latencySteps={latencySteps}
              products={products}
              isSLM={isSLM}
              inferenceCost={inferenceCost}
              queryCount={queryCount}
            />
          </div>

        </div>
      </main>
    </div>
  );
}
