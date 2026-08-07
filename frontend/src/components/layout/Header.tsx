"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Sparkles, ShieldCheck, ShoppingCart, LayoutDashboard, Zap } from 'lucide-react';
import { useAppStore } from '@/store/useStore';

export const Header: React.FC = () => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const activeIntentLabel = useAppStore((state) => state.activeIntentLabel);
  const consentGiven = useAppStore((state) => state.consentGiven);
  const toggleConsent = useAppStore((state) => state.toggleConsent);
  const cart = useAppStore((state) => state.cart);
  const toggleCartOpen = useAppStore((state) => state.toggleCartOpen);

  const cartTotalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-gray-800/80 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-accent-purple to-accent-cyan p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-background rounded-[10px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-accent-cyan group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-accent-cyan">
              IntentIQ
            </span>
            <span className="hidden sm:inline-block ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              AI Hackathon MVP
            </span>
          </div>
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-lg relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search naturally (e.g., 'Minimalist desk lamp under 3000')..."
            className="w-full py-2 pl-9 pr-4 rounded-xl bg-gray-900/90 border border-gray-800 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
          />
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
        </form>

        {/* Active Intent Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs">
          <Sparkles className="w-3.5 h-3.5 text-accent-cyan animate-pulse" />
          <span className="text-gray-400">Intent:</span>
          <span className="font-medium text-indigo-300 line-clamp-1 max-w-[140px]">{activeIntentLabel}</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* DPDP Consent Toggle */}
          <button
            onClick={toggleConsent}
            title={consentGiven ? "DPDP Consent: Active (Personalization ON)" : "DPDP Consent: Revoked (Personalization OFF)"}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              consentGiven
                ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/50"
                : "bg-rose-950/40 text-rose-300 border-rose-500/30 hover:bg-rose-900/50"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden md:inline">DPDP:</span>
            <span>{consentGiven ? "ON" : "OFF"}</span>
          </button>

          {/* Cart Icon */}
          <button
            onClick={toggleCartOpen}
            className="relative p-2 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            {cartTotalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-accent-cyan text-gray-950 font-bold text-[10px] flex items-center justify-center animate-bounce">
                {cartTotalItems}
              </span>
            )}
          </button>

          {/* AI Ops Dashboard Link */}
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-accent-purple hover:opacity-90 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Ops</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
