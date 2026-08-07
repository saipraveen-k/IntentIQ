'use client';

import React from 'react';
import { AIBrainPanel } from '../components/brain/AIBrainPanel';
import { PersonalizedFeed } from '../components/feed/PersonalizedFeed';
import { Search, Sparkles, Zap, ArrowRight, ShieldCheck, Database } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function HomePage() {
  const { toggleSearchModal } = useStore();

  return (
    <div className="space-y-12">
      
      {/* Hero Banner Header */}
      <section className="relative overflow-hidden rounded-3xl glass-panel p-8 lg:p-12 border border-blue-500/20 text-center space-y-6">
        <div className="ambient-glow glow-blue top-0 left-1/2 -translate-x-1/2 w-96 h-96 opacity-30" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill text-xs font-semibold text-blue-400">
          <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
          <span>Every Click Has Intent. Every Recommendation Has a Reason.</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
          Personalized Multi-Intent Discovery Engine
        </h1>

        <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Powered by real-time clickstream telemetry, Instacart order basket graphs, FAISS HNSW vector similarity search, and Gemini 1.5 Flash explainability.
        </p>

        {/* Quick Search Launcher Button */}
        <div className="pt-2">
          <button
            onClick={toggleSearchModal}
            className="inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-500/25 transition-all hover:scale-105 active:scale-95"
          >
            <Search className="w-4 h-4" />
            <span>Launch Semantic AI Vector Search</span>
            <kbd className="px-2 py-0.5 text-xs bg-slate-900/60 rounded text-blue-200 font-mono">⌘K</kbd>
          </button>
        </div>

        {/* System Badges */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-400" /> Sub-1000ms Latency SLA
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-blue-400" /> Instacart Primary Dataset
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> DPDP Act 2023 Compliant
          </span>
        </div>
      </section>

      {/* SECTION 1: AI SHOPPING BRAIN CONTROL PANEL */}
      <AIBrainPanel />

      {/* SECTION 2 & 3: AI GENERATED RECOMMENDATIONS FEED & XAI */}
      <PersonalizedFeed />

    </div>
  );
}
