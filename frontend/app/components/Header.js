'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, 
  ShoppingBag, 
  Sparkles, 
  LogOut,
  ChevronDown,
  ChevronRight,
  Heart
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from './CartContext';

export default function Header({ 
  searchQuery, 
  onQueryChange, 
  onSearchSubmit, 
  suggestions, 
  showSuggestions, 
  onSelectSuggestion, 
  onCartClick,
  onLogoClick
}) {
  const { user, logout } = useAuth();
  const { totalItems, totalPrice } = useCart();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 border-b border-slate-100 shadow-sm blur-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 py-2">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={onLogoClick}>
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900">intent<span className="text-indigo-600">IQ</span></span>
              <span className="block text-[8px] text-slate-400 font-extrabold uppercase tracking-wider leading-none">Fresh Express Market</span>
            </div>
          </div>
          <Link 
            href="/agents" 
            className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors hidden md:block"
          >
            How It Works
          </Link>
          <div className="w-px h-4 bg-slate-200 hidden md:block"></div>
          <Link 
            href="/dashboard" 
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors hidden md:block"
          >
            Analytics & Insights
          </Link>
        </div>

        {/* Search bar */}
        <div className="flex-1 max-w-lg relative">
          <form onSubmit={onSearchSubmit} className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
              <Search className="w-4 h-4" />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={onQueryChange}
              placeholder="Search organic bananas, strawberries, milk, coffee..." 
              className="w-full bg-slate-50/80 border border-slate-200/80 rounded-2xl py-2 pl-9 pr-24 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
            />
            <button type="submit" className="absolute right-1.5 top-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-1.5 rounded-xl transition-all shadow-sm">
              Search
            </button>
          </form>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => onSelectSuggestion(suggestion)}
                  className="w-full px-4 py-2.5 text-left text-xs sm:text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors flex items-center justify-between font-medium"
                >
                  <span>{suggestion}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-3.5 flex-shrink-0">
          <button className="text-slate-400 hover:text-rose-500 transition-colors relative hidden sm:block p-2 rounded-xl hover:bg-slate-50">
            <Heart className="w-5 h-5" />
          </button>
          
          <button 
            onClick={onCartClick}
            className="relative bg-slate-50 hover:bg-white border border-slate-200/80 px-3 py-2 rounded-2xl hover:border-indigo-500 transition-all flex items-center gap-2 shadow-2xs group"
          >
            <ShoppingBag className="w-4.5 h-4.5 text-slate-700 group-hover:text-indigo-600 transition-colors" />
            {totalItems > 0 ? (
              <>
                <span className="text-xs font-black text-slate-800 hidden md:inline">₹{totalPrice.toFixed(2)}</span>
                <span className="bg-indigo-600 text-white text-[10px] font-black h-5 min-w-[20px] px-1 rounded-full flex items-center justify-center leading-none animate-pulse-glow">
                  {totalItems}
                </span>
              </>
            ) : (
              <span className="text-xs font-bold text-slate-600 hidden md:inline">Basket</span>
            )}
          </button>

          {/* User Profile Dropdown */}
          {user && (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 bg-slate-50 hover:bg-white border border-slate-200/80 pl-2.5 pr-1.5 py-1.5 rounded-2xl hover:border-indigo-500 transition-all shadow-2xs"
              >
                <div className="w-6.5 h-6.5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black border border-indigo-200">
                  {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="text-xs font-bold text-slate-700 hidden sm:inline max-w-[90px] truncate">
                  {user.email?.split('@')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 py-2.5 overflow-hidden animate-fade-in">
                  <div className="px-4 py-2 border-b border-slate-100 flex flex-col gap-0.5">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Shopper Account</span>
                    <span className="text-xs font-bold text-slate-800 truncate">{user.email}</span>
                  </div>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2 mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </header>
  );
}
