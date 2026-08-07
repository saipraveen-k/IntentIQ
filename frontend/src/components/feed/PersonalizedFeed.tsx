'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Zap, SlidersHorizontal } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { api, Product } from '../../lib/api';
import { useStore } from '../../store/useStore';

export const PersonalizedFeed: React.FC = () => {
  const { sessionId, activeIntentLabel, intentConfidence } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const data = await api.getFeed(sessionId, 12);
      if (data.products && data.products.length > 0) {
        setProducts(data.products);
      }
    } catch (err) {
      console.warn('Feed fetch warning:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [sessionId]);

  const categories = ['ALL', ...Array.from(new Set(products.map((p) => p.category)))];
  const filteredProducts = activeCategory === 'ALL'
    ? products
    : products.filter((p) => p.category === activeCategory);

  return (
    <section className="space-y-6">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-blue-500/20 text-blue-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">AI Generated For You</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Hybrid recommendations tuned to <span className="text-blue-400 font-semibold">{activeIntentLabel}</span> ({Math.round(intentConfidence * 100)}% confidence).
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Display */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-4 h-80 animate-pulse space-y-4">
              <div className="w-full h-40 bg-slate-800 rounded-xl" />
              <div className="w-3/4 h-4 bg-slate-800 rounded" />
              <div className="w-1/2 h-4 bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-3 border border-white/10">
          <Zap className="w-8 h-8 text-blue-400 mx-auto" />
          <h3 className="text-base font-bold text-white">No products found for filter</h3>
          <p className="text-xs text-slate-400">Try resetting the category filter to view your personalized AI feed.</p>
          <button
            onClick={() => setActiveCategory('ALL')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl"
          >
            Reset Filters
          </button>
        </div>
      )}

    </section>
  );
};
