'use client';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Flame, Sparkles } from 'lucide-react';
import ProductCard from './ProductCard';

export default function TrendingCarousel({ items, onProductClick }) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' 
        ? scrollLeft - clientWidth / 1.5 
        : scrollLeft + clientWidth / 1.5;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="mb-10 bg-gradient-to-b from-white to-slate-50/50 border border-slate-100 rounded-3xl p-6 shadow-sm relative overflow-hidden">
      
      {/* Decorative top accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-600"></div>

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-sm animate-pulse-glow">
            <Flame className="w-5 h-5 fill-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-800 text-base sm:text-lg tracking-tight">Trending Weekly Favorites</h3>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Top Rated
              </span>
            </div>
            <p className="text-slate-500 text-xs mt-0.5">Most ordered items in your neighborhood today</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => scroll('left')}
            aria-label="Scroll left"
            className="w-9 h-9 rounded-full border border-slate-200 hover:border-indigo-600 text-slate-600 hover:text-indigo-600 transition-all flex items-center justify-center bg-white shadow-sm hover:shadow-md active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={() => scroll('right')}
            aria-label="Scroll right"
            className="w-9 h-9 rounded-full border border-slate-200 hover:border-indigo-600 text-slate-600 hover:text-indigo-600 transition-all flex items-center justify-center bg-white shadow-sm hover:shadow-md active:scale-95"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2 px-1"
      >
        {items.slice(0, 10).map((item) => (
          <div key={item.product_id || item.id} className="min-w-[210px] w-[230px] flex-shrink-0 transform transition-transform hover:z-10">
            <ProductCard item={item} onProductClick={onProductClick} />
          </div>
        ))}
      </div>
    </section>
  );
}
