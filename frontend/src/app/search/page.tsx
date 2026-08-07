'use client';

import React, { useState } from 'react';
import { Search, Sparkles, Filter, Zap, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useStore } from '../../store/useStore';
import { api, Product } from '../../lib/api';
import { ProductCard } from '../../components/feed/ProductCard';

export default function SearchPage() {
  const { sessionId } = useStore();
  const [query, setQuery] = useState('healthy breakfast');
  const [results, setResults] = useState<Product[]>([]);
  const [extractedIntents, setExtractedIntents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [budgetMax, setBudgetMax] = useState<number | undefined>(undefined);

  const promptChips = [
    "healthy breakfast",
    "protein snacks",
    "organic fruits",
    "low sugar drinks",
    "fresh dairy milk",
    "coffee under ₹500"
  ];

  const executeSearch = async (q: string) => {
    if (!q.trim()) return;
    setQuery(q);
    setLoading(true);
    try {
      const data = await api.searchSemantic(sessionId, q, 12);
      setResults(data.results || []);
      setExtractedIntents(data.extracted_intents || []);
      setBudgetMax(data.budget_max);
    } catch (e) {
      console.warn('Search view notice:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header Navigation */}
      <div className="flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to AI Brain
        </Link>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/20">
          <Sparkles className="w-3.5 h-3.5" /> Dense Vector HNSW Similarity Search
        </div>
      </div>

      {/* Search Input Box */}
      <div className="glass-panel p-6 rounded-3xl border border-blue-500/30 shadow-2xl space-y-4">
        <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-3.5 rounded-2xl border border-white/10">
          <Search className="w-5 h-5 text-blue-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && executeSearch(query)}
            placeholder="Type any natural language query... e.g. 'organic fruits' or 'low sugar drinks'"
            className="w-full bg-transparent text-white placeholder-slate-500 text-base focus:outline-none"
          />
          <button
            onClick={() => executeSearch(query)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all"
          >
            Search
          </button>
        </div>

        {/* Prompt Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
          <span className="text-slate-400 font-semibold">Popular AI Prompts:</span>
          {promptChips.map((chip) => (
            <button
              key={chip}
              onClick={() => executeSearch(chip)}
              className="px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 font-medium transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Extracted Intents Banner */}
        {extractedIntents.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 bg-blue-950/40 p-3 rounded-xl border border-blue-500/20">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="font-semibold">Extracted Sub-Intents:</span>
            {extractedIntents.map((intent, i) => (
              <span key={i} className="px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-300 font-bold">
                {intent}
              </span>
            ))}
            {budgetMax && (
              <span className="ml-auto px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 font-bold">
                Budget Cap: ₹{budgetMax}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 space-y-2">
          <Zap className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
          <p className="text-sm font-semibold">Performing Vector Cosine Search...</p>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-white">Matching Instacart Products ({results.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {results.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-3">
          <Search className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="font-bold text-white text-base">Enter a query to execute semantic search</h3>
          <p className="text-xs text-slate-400">Click any popular prompt above or type a natural language shopping request.</p>
        </div>
      )}

    </div>
  );
}
