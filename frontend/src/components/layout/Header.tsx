'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ShoppingBag, Activity, ShieldCheck, Sparkles, User } from 'lucide-react';
import { useStore } from '../../store/useStore';

export const Header: React.FC = () => {
  const { activeIntentLabel, intentConfidence, cart, toggleCart, toggleSearchModal, togglePrivacyModal } = useStore();
  const [scrolled, setScrolled] = useState(false);
  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 px-6 lg:px-12 py-3.5 ${
      scrolled
        ? 'bg-white/90 backdrop-blur-md border-b border-gray-200/80 shadow-sm'
        : 'bg-transparent border-b border-transparent'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo & Tagline */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
            IQ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-gray-900">IntentIQ</span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-gray-700 border border-gray-200">
                Enterprise 3.2
              </span>
            </div>
          </div>
        </Link>

        {/* Live Intent Pill */}
        <div className="hidden md:flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-100/80 border border-gray-200 text-xs font-medium text-gray-700">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-gray-500">Active Intent:</span>
          <span className="text-gray-900 font-semibold">{activeIntentLabel}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1" />
          <span className="text-emerald-700 font-bold">{Math.round(intentConfidence * 100)}%</span>
        </div>

        {/* Actions & Navigation */}
        <div className="flex items-center gap-3">
          
          {/* Rounded Search Bar */}
          <button
            onClick={toggleSearchModal}
            className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200/80 text-gray-700 text-xs font-medium transition-colors border border-gray-200/60 outline-none"
          >
            <Search className="w-3.5 h-3.5 text-gray-500" />
            <span className="hidden sm:inline">Search produce, pantry, items...</span>
            <kbd className="hidden lg:inline px-2 py-0.5 text-[10px] bg-white rounded-full text-gray-500 font-mono border border-gray-200">⌘K</kbd>
          </button>

          {/* Operations Center Link */}
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors shadow-sm"
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Operations</span>
          </Link>

          {/* Privacy Purge Launcher */}
          <button
            onClick={togglePrivacyModal}
            className="p-2.5 rounded-full bg-gray-100 hover:bg-gray-200/80 text-gray-600 border border-gray-200/60 transition-colors"
            title="Privacy Controls"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </button>

          {/* Cart Drawer Toggle */}
          <button
            onClick={toggleCart}
            className="relative p-2.5 rounded-full bg-gray-900 hover:bg-gray-800 text-white shadow-sm transition-all active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            {totalCartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white font-bold text-[10px] flex items-center justify-center border-2 border-white">
                {totalCartCount}
              </span>
            )}
          </button>

        </div>

      </div>
    </header>
  );
};

