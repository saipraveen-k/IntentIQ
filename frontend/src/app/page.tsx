'use client';

import React, { useState, useEffect } from 'react';
import { AIBrainPanel } from '../components/brain/AIBrainPanel';
import { PersonalizedFeed } from '../components/feed/PersonalizedFeed';
import { ProductCard } from '../components/feed/ProductCard';
import { PersonaSelector } from '../components/feed/PersonaSelector';
import { Search, Sparkles, ArrowRight, TrendingUp, Package, Heart, Crown } from 'lucide-react';
import { useStore } from '../store/useStore';
import { api, Product } from '../lib/api';

export default function HomePage() {
  const { toggleSearchModal, sessionId, activeIntentLabel } = useStore();
  const [fbtProducts, setFbtProducts] = useState<Product[]>([]);
  const [healthyProds, setHealthyProds] = useState<Product[]>([]);
  const [premiumProds, setPremiumProds] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const trendingCategories = [
    { name: 'Fresh Produce', icon: '🥑', count: '384 Items' },
    { name: 'Dairy & Eggs', icon: '🥚', count: '215 Items' },
    { name: 'Organic Pantry', icon: '🌾', count: '412 Items' },
    { name: 'Snacks & Beverages', icon: '🥤', count: '189 Items' },
    { name: 'Frozen Goods', icon: '❄️', count: '145 Items' },
  ];

  const loadHomeData = async () => {
    setLoading(true);
    try {
      const feedRes = await api.getFeed(sessionId, 12);
      if (feedRes.products) {
        const uniqueProds = Array.from(new Map(feedRes.products.map(p => [p.id, p])).values());
        setFbtProducts(uniqueProds.slice(0, 4));
        setHealthyProds(uniqueProds.filter(p => p.category.includes('Produce') || p.title.includes('Organic')).slice(0, 4));
        setPremiumProds(uniqueProds.filter(p => p.price > 40).slice(0, 4));
      }
    } catch (e) {
      console.warn('Home data load notice:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHomeData();
  }, [sessionId]);

  return (
    <div className="space-y-16 py-6 max-w-7xl mx-auto px-4 sm:px-6">
      
      {/* 1. HERO EDITORIAL BANNER */}
      <section className="relative overflow-hidden rounded-3xl bg-white border border-gray-200/80 p-8 sm:p-14 text-center space-y-6 shadow-sm">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D7ECFF] text-[#1E40AF] text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Curated Grocery Intelligence • Instacart Powered</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-gray-900 max-w-4xl mx-auto leading-tight">
          Find Products You'll Actually Love
        </h1>

        <p className="text-gray-500 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-normal">
          Personalized in real-time across 134 Instacart aisles using multi-signal shopper intent vectors and 384d semantic search.
        </p>

        {/* Quick Search Launcher Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={toggleSearchModal}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all active:scale-95"
          >
            <Search className="w-4 h-4" />
            <span>Launch Semantic Discovery</span>
            <kbd className="px-2.5 py-0.5 text-xs bg-slate-800 rounded-full text-gray-300 font-mono">⌘K</kbd>
          </button>
        </div>
      </section>

      {/* 2. PERSONA SELECTOR */}
      <section className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
        <PersonaSelector onPersonaChange={loadHomeData} />
      </section>

      {/* 3. CURATED FOR YOU */}
      <section className="space-y-4">
        <PersonalizedFeed />
      </section>

      {/* 4. COMPLETE YOUR BASKET CAROUSEL */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-gray-200/80 pb-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-gray-700" />
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Complete Your Basket</h2>
          </div>
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3.5 py-1 rounded-full border border-gray-200">
            Frequently Bought Together
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-3xl p-5 h-72 animate-shimmer border border-gray-200" />
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

      {/* 5. HEALTHY ALTERNATIVES */}
      {healthyProds.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-200/80 pb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-full bg-[#DFF7E2] text-[#065F46]">
                <Heart className="w-4 h-4" />
              </span>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Healthy Picks & Organic Choices</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {healthyProds.map((prod) => (
              <ProductCard key={`healthy-${prod.id}`} product={prod} />
            ))}
          </div>
        </section>
      )}

      {/* 6. PREMIUM ALTERNATIVES */}
      {premiumProds.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-200/80 pb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-full bg-[#DCCEF9] text-[#4C1D95]">
                <Crown className="w-4 h-4" />
              </span>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Premium Artisanal Selections</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {premiumProds.map((prod) => (
              <ProductCard key={`premium-${prod.id}`} product={prod} />
            ))}
          </div>
        </section>
      )}

      {/* 7. TRENDING DEPARTMENTS */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-gray-200/80 pb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Trending Departments</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {trendingCategories.map((cat) => (
            <div
              key={cat.name}
              className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all space-y-2"
            >
              <div className="text-2xl">{cat.icon}</div>
              <h3 className="font-bold text-sm text-gray-900">{cat.name}</h3>
              <p className="text-xs text-gray-500 font-medium">{cat.count}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 8. EDITORIAL COLLECTIONS */}
      <section className="bg-white p-8 rounded-3xl border border-gray-200 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Editorial Curated Collections</h2>
            <p className="text-xs text-gray-500 mt-1">Explore basket themes curated by Instacart order co-occurrence graph data.</p>
          </div>
          <button
            onClick={toggleSearchModal}
            className="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-900 text-xs font-semibold transition-all flex items-center gap-2"
          >
            <span>Explore All Collections</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { title: "Organic Breakfast Routine", desc: "Low sugar oats, almond milk, and fresh berries", bg: "bg-[#DFF7E2]" },
            { title: "High Protein Fitness", desc: "Greek yogurt, whey bars, and raw almonds", bg: "bg-[#F8D8E8]" },
            { title: "Cold Pressed Detox Juices", desc: "Green detox apple, orange, and citrus blends", bg: "bg-[#D7ECFF]" }
          ].map((col, i) => (
            <button
              key={i}
              onClick={toggleSearchModal}
              className={`p-6 rounded-3xl border border-gray-200 text-left space-y-2 hover:shadow-md transition-all ${col.bg}`}
            >
              <h3 className="font-bold text-base text-gray-900">{col.title}</h3>
              <p className="text-xs text-gray-700 leading-relaxed">{col.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* 9. SHOPPING INTELLIGENCE (COLLAPSED BY DEFAULT) */}
      <section className="space-y-4">
        <AIBrainPanel />
      </section>

    </div>
  );
}

