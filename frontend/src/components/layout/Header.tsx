'use client';

import React from 'react';
import Link from 'next/link';
import { Search, ShoppingBag, Activity, ShieldCheck, Sparkles } from 'lucide-react';
import { useStore } from '../../store/useStore';

export const Header: React.FC = () => {
  const { activeIntentLabel, intentConfidence, cart, toggleCart, toggleSearchModal, togglePrivacyModal } = useStore();
  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-4 lg:px-8 py-4 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Logo & Tagline */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-semibold text-lg tracking-tight text-gray-900">IntentIQ</span>
            <p className="text-xs text-gray-500 hidden sm:block mt-0.5">Smart Shopping</p>
          </div>
        </Link>

        {/* Live Intent Indicator Pill */}
        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>{activeIntentLabel}</span>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <span className="text-blue-600 font-semibold">{Math.round(intentConfidence * 100)}%</span>
        </div>

        {/* Actions & Navigation */}
        <div className="flex items-center gap-2">
          
          {/* Command-K Search Launcher */}
          <button
            onClick={toggleSearchModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-all"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden lg:inline px-1.5 py-0.5 text-[10px] bg-white rounded text-gray-500 font-mono border border-gray-200">⌘K</kbd>
          </button>

          {/* Intelligence Operations Center Link */}
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-gray-100 text-gray-600 text-sm font-medium transition-all"
          >
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Analytics</span>
          </Link>

          {/* Privacy Purge Launcher */}
          <button
            onClick={togglePrivacyModal}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-all"
            title="Privacy Control"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>

          {/* Cart Drawer Toggle */}
          <button
            onClick={toggleCart}
            className="relative p-2.5 rounded-xl bg-black hover:bg-gray-800 text-white transition-all hover:scale-105"
          >
            <ShoppingBag className="w-4 h-4" />
            {totalCartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-500 text-white font-bold text-[10px] flex items-center justify-center shadow-sm">
                {totalCartCount}
              </span>
            )}
          </button>

        </div>

      </div>
    </header>
  );
};
