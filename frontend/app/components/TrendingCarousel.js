'use client';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import ProductCard from './ProductCard';

export default function TrendingCarousel({ items, onProductClick }) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' 
        ? scrollLeft - clientWidth / 2 
        : scrollLeft + clientWidth / 2;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="mb-8 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500">
            <Flame className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-base">Trending Discoveries</h3>
            <p className="text-slate-400 text-xs mt-0.5">Most popular items in your area</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => scroll('left')}
            className="w-8 h-8 rounded-full border border-slate-200 hover:border-indigo-500 text-slate-500 hover:text-indigo-600 transition-colors flex items-center justify-center bg-white shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={() => scroll('right')}
            className="w-8 h-8 rounded-full border border-slate-200 hover:border-indigo-500 text-slate-500 hover:text-indigo-600 transition-colors flex items-center justify-center bg-white shadow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-1"
      >
        {items.slice(0, 10).map((item) => (
          <div key={item.product_id} className="min-w-[200px] w-[220px] flex-shrink-0">
            <ProductCard item={item} onProductClick={onProductClick} />
          </div>
        ))}
      </div>
    </section>
  );
}
