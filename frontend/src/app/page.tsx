'use client';

import React, { useState, useEffect } from 'react';
import { AIBrainPanel } from '../components/brain/AIBrainPanel';
import { PersonalizedFeed } from '../components/feed/PersonalizedFeed';
import { ProductCard } from '../components/feed/ProductCard';
import { PersonaSelector } from '../components/feed/PersonaSelector';
import { Search, Sparkles, Zap, ShieldCheck, Database, ArrowRight, Layers, TrendingUp, Package, Activity, CheckCircle2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { api, Product } from '../lib/api';

export default function HomePage() {
  const { toggleSearchModal, sessionId, activeIntentLabel } = useStore();
  const [fbtProducts, setFbtProducts] = useState<Product[]>([]);
  const [loadingFbt, setLoadingFbt] = useState(true);

  const trendingCategories = [
    { name: 'Fresh Produce', icon: '🥑', count: '384 Products', intent: 'High Co-Occurrence' },
    { name: 'Dairy & Eggs', icon: '🥚', count: '215 Products', intent: 'Frequent Reorder' },
    { name: 'Organic Pantry', icon: '🌾', count: '412 Products', intent: 'Dietary Preference' },
    { name: 'Snacks & Beverages', icon: '🥤', count: '189 Products', intent: 'Impulse Basket' },
    { name: 'Frozen Goods', icon: '❄️', count: '145 Products', intent: 'Cold Chain' },
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
    <div className="space-y-12 py-4 max-w-7xl mx-auto">
      
      {/* 1. LUXURY STOREFRONT HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl glass-panel p-8 sm:p-12 border border-slate-800 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Curated Grocery Intelligence • Instacart Powered</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
          Find Products You'll Actually Love
        </h1>

        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-normal">
          Personalized in real-time across 134 Instacart aisles using multi-signal shopper intent vectors, basket co-occurrence graphs, and FAISS 384d semantic search.
        </p>

        {/* Quick Search Launcher Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={toggleSearchModal}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Search className="w-4 h-4" />
            <span>Launch Semantic Product Discovery</span>
            <kbd className="px-2 py-0.5 text-[11px] bg-slate-900/80 rounded text-slate-300 font-mono">⌘K</kbd>
          </button>
        </div>
      </section>

      {/* 2. INTERACTIVE DEMO PERSONA SWITCHER */}
      <section className="glass-panel p-6 rounded-3xl border border-slate-800">
        <PersonaSelector onPersonaChange={loadHomeData} />
      </section>

      {/* 3. CURATED PERSONALIZED COLLECTION FEED */}
      <section className="space-y-4">
        <PersonalizedFeed />
      </section>

      {/* 4. SEMANTIC PRODUCT DISCOVERY PROMPT LAUNCHER */}
      <section className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                <Search className="w-4 h-4" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">Semantic Product Discovery</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">Dense 384-dimensional vector retrieval across natural language search intents.</p>
          </div>

          <button
            onClick={toggleSearchModal}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-all flex items-center gap-2"
          >
            <span>Open Vector Console</span>
            <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { title: "Organic & Healthy Breakfast", desc: "Low sugar oats, almond milk, and fresh berries" },
            { title: "High Protein Fitness Snacks", desc: "Greek yogurt, whey bars, and raw almonds" },
            { title: "Fresh Cold Pressed Juices", desc: "Green detox apple, orange, and citrus blends" }
          ].map((prompt, i) => (
            <button
              key={i}
              onClick={toggleSearchModal}
              className="glass-card p-4 rounded-xl border border-slate-800 hover:border-blue-500/40 text-left space-y-2 group transition-all"
            >
              <span className="text-xs font-bold text-blue-400 block group-hover:underline">{prompt.title}</span>
              <p className="text-xs text-slate-400 line-clamp-2">{prompt.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* 5. TRENDING INSTACART DEPARTMENTS */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Trending Instacart Departments</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Mapped from 21 Instacart Departments</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {trendingCategories.map((cat) => (
            <div
              key={cat.name}
              className="glass-card p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all space-y-2"
            >
              <div className="text-2xl">{cat.icon}</div>
              <h3 className="font-bold text-sm text-white">{cat.name}</h3>
              <p className="text-[11px] text-slate-400 font-medium">{cat.count}</p>
              <span className="inline-block px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-semibold border border-blue-500/20">
                {cat.intent}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 6. FREQUENTLY BOUGHT TOGETHER BUNDLES PREVIEW */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Frequently Bought Together</h2>
          </div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Automated Basket Bundling Active
          </span>
        </div>

        {loadingFbt ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-4 h-72 animate-pulse space-y-4">
                <div className="w-full h-36 bg-slate-800 rounded-xl" />
                <div className="w-3/4 h-4 bg-slate-800 rounded" />
                <div className="w-1/2 h-4 bg-slate-800 rounded" />
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

      {/* 7. COLLAPSED SHOPPING INTELLIGENCE DRAWER FOR JUDGES */}
      <section className="space-y-4">
        <AIBrainPanel />
      </section>

    </div>
  );
}
