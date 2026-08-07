"use client";

import React, { useEffect, useState } from 'react';
import { Sparkles, RefreshCw, Layers } from 'lucide-react';
import { api, Product } from '@/lib/api';
import { useAppStore } from '@/store/useStore';
import { ProductCard } from '@/components/feed/ProductCard';

export default function HomePage() {
  const sessionId = useAppStore((state) => state.sessionId);
  const activeIntentLabel = useAppStore((state) => state.activeIntentLabel);
  const setActiveIntent = useAppStore((state) => state.setActiveIntent);
  const consentGiven = useAppStore((state) => state.consentGiven);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const data = await api.getPersonalizedFeed(sessionId);
      setProducts(data.products);
      setActiveIntent(data.active_intent, data.intent_confidence);
    } catch (e) {
      console.error("Failed to fetch feed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [sessionId, consentGiven]);

  return (
    <div className="space-y-6">
      {/* Hero Banner / Active Intent Bar */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden border border-indigo-500/30">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-accent-cyan" />
                Real-Time Multi-Intent Engine
              </span>
              {!consentGiven && (
                <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30">
                  DPDP Consent Revoked
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Personalized Discovery Feed
            </h1>
            <p className="text-sm text-gray-400 mt-1 max-w-xl">
              Click or dwell on products to watch the Intent Agent recalculate your 1024-dim intent vector in real time.
            </p>
          </div>

          <button
            onClick={fetchFeed}
            disabled={loading}
            className="py-2.5 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold flex items-center gap-2 border border-gray-700 transition-all shadow-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Feed
          </button>
        </div>
      </div>

      {/* Active Intent Status Bar */}
      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-900/60 border border-gray-800 text-xs text-gray-300">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>Active Session Intent:</span>
          <span className="font-bold text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/30">
            {activeIntentLabel}
          </span>
        </div>
        <span className="text-gray-500 hidden sm:inline">FAISS HNSW Vector Retrieval (SLA &lt; 5ms)</span>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="glass-panel h-80 rounded-xl animate-pulse bg-gray-900/40" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onRefreshFeed={fetchFeed} />
          ))}
        </div>
      )}
    </div>
  );
}
