'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Sparkles, ArrowRight, Tag, Zap } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { api, Product } from '../../lib/api';
import { ProductCard } from '../feed/ProductCard';

export const SemanticSearchModal: React.FC = () => {
  const { isSearchModalOpen, toggleSearchModal, sessionId } = useStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [extractedIntents, setExtractedIntents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const promptChips = [
    "healthy breakfast",
    "protein snacks",
    "organic fruits",
    "low sugar drinks",
    "fresh dairy milk"
  ];

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setQuery(searchQuery);
    setLoading(true);
    try {
      const data = await api.searchSemantic(sessionId, searchQuery, 8);
      setResults(data.results || []);
      setExtractedIntents(data.extracted_intents || []);
    } catch (e) {
      console.warn('Search notice:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleSearchModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSearchModal]);

  if (!isSearchModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      
      <div className="w-full max-w-4xl glass-panel rounded-2xl border border-blue-500/30 overflow-hidden shadow-2xl space-y-4 p-6">
        
        {/* Search Input Bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3 flex-1">
            <Search className="w-5 h-5 text-blue-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
              placeholder="Ask IntentIQ... e.g. 'organic fruits' or 'protein snacks'"
              className="w-full bg-transparent text-white placeholder-slate-500 text-base focus:outline-none"
              autoFocus
            />
          </div>
          <button
            onClick={toggleSearchModal}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Prompt Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
          <span className="text-slate-400 font-medium">Try:</span>
          {promptChips.map((chip) => (
            <button
              key={chip}
              onClick={() => handleSearch(chip)}
              className="px-3 py-1 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 font-medium whitespace-nowrap transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Extracted Intents Sub-header */}
        {extractedIntents.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-300 bg-blue-950/40 p-2.5 rounded-xl border border-blue-500/20">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>Extracted Vector Sub-Intents:</span>
            {extractedIntents.map((intent, i) => (
              <span key={i} className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold">
                {intent}
              </span>
            ))}
          </div>
        )}

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
          {loading ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Zap className="w-6 h-6 text-blue-400 animate-spin mx-auto" />
              <p className="text-xs">Executing FAISS HNSW Vector Similarity Search...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : query ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm font-semibold">No direct vector matches found for "{query}"</p>
              <p className="text-xs mt-1">Try searching for broader grocery terms like 'produce' or 'dairy'.</p>
            </div>
          ) : null}
        </div>

      </div>

    </div>
  );
};
