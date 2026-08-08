'use client';

import React, { useState, useEffect } from 'react';
import { AIBrainPanel } from '../components/brain/AIBrainPanel';
import { PersonalizedFeed } from '../components/feed/PersonalizedFeed';
import { ProductCard } from '../components/feed/ProductCard';
import { PersonaSelector } from '../components/feed/PersonaSelector';
import { Search, Sparkles, ArrowRight, TrendingUp, Package } from 'lucide-react';
import { useStore } from '../store/useStore';
import { api, Product } from '../lib/api';

export default function HomePage() {
  const { toggleSearchModal, sessionId, activeIntentLabel } = useStore();
  const [fbtProducts, setFbtProducts] = useState<Product[]>([]);
  const [loadingFbt, setLoadingFbt] = useState(true);

  const trendingCategories = [
    { name: 'Fresh Produce', icon: '🥑', count: '384 items' },
    { name: 'Dairy & Eggs', icon: '🥚', count: '215 items' },
    { name: 'Organic Pantry', icon: '🌾', count: '412 items' },
    { name: 'Snacks & Beverages', icon: '🥤', count: '189 items' },
    { name: 'Frozen Goods', icon: '❄️', count: '145 items' },
  ];

  const loadHomeData = async () => {
    setLoadingFbt(true);
    try {
      const feedRes = await api.getFeed(sessionId, 8);
      if (feedRes.products) {
        const uniqueProds = Array.from(new Map(feedRes.products.map(p => [p.id, p])).values());
        setFbtProducts(uniqueProds.slice(0, 4));
      }
    } catch (e) {
      console.warn('Home data load notice:', e);
    } finally {
      setLoadingFbt(false);
    }
  };

  useEffect(() => {
    loadHomeData();
  }, [sessionId]);

  return (
    <div className="space-y-16 py-8 max-w-7xl mx-auto">
      
      {/* Hero Section */}
      <section className="text-center space-y-8 py-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
          <Sparkles className="w-4 h-4" />
          <span>AI-Powered Shopping</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 max-w-3xl mx-auto leading-tight">
          Discover products you'll love
        </h1>

        <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Personalized recommendations powered by AI. Learn your preferences and suggest items that match your taste.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={toggleSearchModal}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-black hover:bg-gray-800 text-white font-medium transition-all hover:scale-105 active:scale-95"
          >
            <Search className="w-5 h-5" />
            <span>Start shopping</span>
          </button>
        </div>
      </section>

      {/* Persona Selector */}
      <section className="card-base p-6">
        <PersonaSelector onPersonaChange={loadHomeData} />
      </section>

      {/* Personalized Feed */}
      <section className="space-y-6">
        <PersonalizedFeed />
      </section>

      {/* Quick Search Prompts */}
      <section className="card-base p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Quick searches</h2>
            <p className="text-sm text-gray-500 mt-1">Popular searches from other shoppers</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { title: "Healthy breakfast", desc: "Oats, almond milk, fresh berries" },
            { title: "Protein snacks", desc: "Greek yogurt, protein bars, nuts" },
            { title: "Organic fruits", desc: "Fresh seasonal organic produce" }
          ].map((prompt, i) => (
            <button
              key={i}
              onClick={toggleSearchModal}
              className="card-base p-5 text-left space-y-2 group hover:border-blue-200"
            >
              <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-600">{prompt.title}</span>
              <p className="text-sm text-gray-500 line-clamp-2">{prompt.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Trending Categories */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900">Popular categories</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {trendingCategories.map((cat) => (
            <div
              key={cat.name}
              className="card-base p-5 text-center space-y-3 hover:border-gray-300 cursor-pointer"
            >
              <div className="text-3xl">{cat.icon}</div>
              <h3 className="font-semibold text-sm text-gray-900">{cat.name}</h3>
              <p className="text-xs text-gray-500">{cat.count}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Frequently Bought Together */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900">Frequently bought together</h2>
          </div>
        </div>

        {loadingFbt ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card-base p-4 h-80 space-y-4">
                <div className="w-full h-40 skeleton" />
                <div className="w-3/4 h-4 skeleton" />
                <div className="w-1/2 h-4 skeleton" />
              </div>
            ))}
          </div>
        ) : fbtProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {fbtProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        ) : null}
      </section>

      {/* AI Brain Panel */}
      <section className="space-y-4">
        <AIBrainPanel />
      </section>

    </div>
  );
}
