'use client';

import React from 'react';
import Link from 'next/link';
import { Brain, Search, ShoppingBag, Activity, ShieldCheck, Sparkles } from 'lucide-react';
import { useStore } from '../../store/useStore';

export const Header: React.FC = () => {
  const { activeIntentLabel, intentConfidence, cart, toggleCart, toggleSearchModal, togglePrivacyModal } = useStore();
  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-white/10 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Logo & Tagline */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-emerald-400 p-[1px] shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#0B1020] rounded-[11px] flex items-center justify-center">
              <Brain className="w-5 h-5 text-blue-400 group-hover:text-emerald-400 transition-colors" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white">IntentIQ</span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
                Enterprise v3.2
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Predictive Shopping Intelligence</p>
          </div>
        </Link>

        {/* Live Intent Indicator Pill */}
        <div className="hidden md:flex items-center gap-2 glass-pill px-4 py-1.5 rounded-full text-xs font-medium text-slate-200 shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          <span className="text-slate-400">Shopping Intent:</span>
          <span className="text-white font-semibold">{activeIntentLabel}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping ml-1" />
          <span className="text-emerald-400 font-bold">{Math.round(intentConfidence * 100)}%</span>
        </div>

        {/* Actions & Navigation */}
        <div className="flex items-center gap-3">
          
          {/* Command-K Search Launcher */}
          <button
            onClick={toggleSearchModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-xs font-medium border border-white/10 transition-colors"
          >
            <Search className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">Semantic Discovery</span>
            <kbd className="hidden lg:inline px-1.5 py-0.5 text-[10px] bg-slate-900 rounded text-slate-400 font-mono">⌘K</kbd>
          </button>

          {/* Intelligence Operations Center Link */}
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-xs font-medium border border-blue-500/20 transition-colors"
          >
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Operations Center</span>
          </Link>

          {/* Privacy Purge Launcher */}
          <button
            onClick={togglePrivacyModal}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 border border-white/10 transition-colors"
            title="DPDP Privacy Control"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </button>

          {/* Cart Drawer Toggle */}
          <button
            onClick={toggleCart}
            className="relative p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-105"
          >
            <ShoppingBag className="w-4 h-4" />
            {totalCartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-400 text-slate-950 font-bold text-[10px] flex items-center justify-center shadow-md animate-bounce">
                {totalCartCount}
              </span>
            )}
          </button>

        </div>

      </div>
    </header>
  );
};
