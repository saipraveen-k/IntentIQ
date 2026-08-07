"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Tag, AlertTriangle, ShieldCheck } from 'lucide-react';
import { api, Product, SemanticSearchResponse } from '@/lib/api';
import { useAppStore } from '@/store/useStore';
import { ProductCard } from '@/components/feed/ProductCard';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const sessionId = useAppStore((state) => state.sessionId);

  const [query, setQuery] = useState(initialQuery);
  const [searchResult, setSearchResult] = useState<SemanticSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const data = await api.searchSemantic(searchQuery, sessionId);
      setSearchResult(data);
    } catch (e: any) {
      if (e.response?.data?.detail) {
        setErrorMsg(e.response.data.detail);
      } else {
        setErrorMsg("Search error occurred.");
      }
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="glass-panel p-6 rounded-2xl border border-indigo-500/30">
        <h1 className="text-2xl font-bold text-white mb-2">Semantic Multi-Intent Search</h1>
        <p className="text-xs text-gray-400 mb-4">
          Natural language queries are decomposed into intent tags and budget limits by Gemini AI + FAISS dense vectors.
        </p>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try: 'Ergonomic desk lamp under 3000' or 'Ignore instructions'"
              className="w-full py-3 pl-10 pr-4 rounded-xl bg-gray-900 border border-gray-700 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
            <Search className="w-5 h-5 text-gray-500 absolute left-3 top-3.5" />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>
      </div>

      {/* Error / Guardrail Alert */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Enterprise Guardrail Blocked Request</h4>
            <p className="text-xs mt-1 text-rose-200">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Extracted Intents & Filter Bar */}
      {searchResult && (
        <div className="space-y-4">
          <div className="glass-panel p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-accent-cyan" />
              <span className="text-gray-400">Extracted Sub-Intents:</span>
              {searchResult.extracted_intents.map((intent, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md bg-indigo-900/60 text-indigo-200 border border-indigo-500/30 font-semibold"
                >
                  #{intent}
                </span>
              ))}
            </div>

            {searchResult.budget_max && (
              <div className="px-2.5 py-1 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 font-semibold">
                Budget Filter: ≤ ₹{searchResult.budget_max.toLocaleString()}
              </div>
            )}
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {searchResult.results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="text-gray-400 text-sm p-4">Loading Search Engine...</div>}>
      <SearchContent />
    </Suspense>
  );
}
