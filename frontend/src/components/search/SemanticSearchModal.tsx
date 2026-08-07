'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Sparkles, Zap } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-gray-900/40 backdrop-blur-sm animate-fadeIn">
      
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-2xl space-y-4 p-6">
        
        {/* Search Input Bar */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3 flex-1">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
              placeholder="Search produce, pantry, snacks... e.g. 'organic berries'"
              className="w-full bg-transparent text-gray-900 placeholder-gray-400 text-base focus:outline-none"
              autoFocus
            />
          </div>
          <button
            onClick={toggleSearchModal}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Prompt Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs scrollbar-none">
          <span className="text-gray-400 font-semibold">Try:</span>
          {promptChips.map((chip) => (
            <button
              key={chip}
              onClick={() => handleSearch(chip)}
              className="px-3.5 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200/80 text-gray-700 font-medium whitespace-nowrap transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Extracted Intents Sub-header */}
        {extractedIntents.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-700 bg-emerald-50/80 p-3 rounded-2xl border border-emerald-100">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-emerald-900">Extracted Intents:</span>
            {extractedIntents.map((intent, i) => (
              <span key={i} className="px-2.5 py-0.5 rounded-full bg-emerald-200/60 text-emerald-900 font-bold">
                {intent}
              </span>
            ))}
          </div>
        )}

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
          {loading ? (
            <div className="text-center py-12 text-gray-400 space-y-2">
              <Zap className="w-6 h-6 text-amber-500 animate-spin mx-auto" />
              <p className="text-xs">Searching 384d vector space...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : query ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm font-semibold">No direct vector matches found for "{query}"</p>
              <p className="text-xs mt-1">Try searching for broader grocery terms like 'fresh' or 'dairy'.</p>
            </div>
          ) : null}
        </div>

      </div>

    </div>
  );
};

