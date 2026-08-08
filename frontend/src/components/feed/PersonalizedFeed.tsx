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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-semibold text-gray-900">Recommended for you</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Based on your <span className="text-blue-600 font-medium">{activeIntentLabel}</span> preferences ({Math.round(intentConfidence * 100)}% match).
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
            <div key={i} className="card-base p-4 h-80 space-y-4">
              <div className="w-full h-40 skeleton" />
              <div className="w-3/4 h-4 skeleton" />
              <div className="w-1/2 h-4 skeleton" />
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
        <div className="card-base p-12 text-center space-y-4">
          <Zap className="w-8 h-8 text-gray-400 mx-auto" />
          <h3 className="text-base font-semibold text-gray-900">No products found</h3>
          <p className="text-sm text-gray-500">Try resetting the category filter to see more recommendations.</p>
          <button
            onClick={() => setActiveCategory('ALL')}
            className="px-6 py-3 bg-black hover:bg-gray-800 text-white font-medium rounded-xl"
          >
            Reset Filters
          </button>
        </div>
      )}

    </section>
  );
};
