'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Zap } from 'lucide-react';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-full bg-[#D7ECFF] text-[#1E40AF]">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Curated For You</h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Personalized collection matching <span className="text-gray-900 font-semibold">{activeIntentLabel}</span> ({Math.round(intentConfidence * 100)}% confidence).
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80'
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
            <div key={i} className="bg-white rounded-3xl p-5 h-80 animate-shimmer space-y-4 border border-gray-200/60">
              <div className="w-full h-44 bg-gray-200/60 rounded-2xl" />
              <div className="w-3/4 h-4 bg-gray-200/60 rounded-full" />
              <div className="w-1/2 h-4 bg-gray-200/60 rounded-full" />
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
        <div className="bg-white p-12 rounded-3xl text-center space-y-3 border border-gray-200">
          <Zap className="w-8 h-8 text-amber-500 mx-auto" />
          <h3 className="text-base font-bold text-gray-900">No products found for category</h3>
          <p className="text-xs text-gray-500">Reset the category filter to view your personalized collection.</p>
          <button
            onClick={() => setActiveCategory('ALL')}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-full shadow-sm"
          >
            Reset Filters
          </button>
        </div>
      )}

    </section>
  );
};

