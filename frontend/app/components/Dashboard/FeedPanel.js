'use client';
import ProductCard from '../ProductCard';
import { Sparkles, RefreshCw } from 'lucide-react';

const COLD_START_ITEMS = [
  { product_id: 13176, name: "Bag of Organic Bananas", price: 9.15, department: "produce" },
  { product_id: 27845, name: "Organic Whole Milk", price: 5.49, department: "dairy eggs" },
  { product_id: 47209, name: "Organic Hass Avocado", price: 8.20, department: "produce" },
  { product_id: 39275, name: "Organic Blueberries", price: 6.99, department: "produce" }
];

export default function FeedPanel({ products, activeIntent, onColdStartClick, onProductClick, loading }) {
  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-5 animate-fade-in">
      
      {/* Dynamic Intent Badge */}
      <div className="bg-gradient-to-r from-indigo-50 to-sky-50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest leading-none block">Inferred Micro-Intent</span>
            <span className="text-sm font-extrabold text-slate-800 mt-1 block">{activeIntent || "Browsing general feed"}</span>
          </div>
        </div>
        <div className="text-[10px] bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
          Active
        </div>
      </div>

      {/* Cold-Start Onboarding */}
      <div className="border border-slate-100 bg-slate-50 rounded-2xl p-4">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cold-Start Onboarding (Click items to reorganize feed)</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
          {COLD_START_ITEMS.map((item) => (
            <button
              key={item.product_id}
              onClick={() => onColdStartClick(item)}
              className="bg-white border border-slate-200 hover:border-indigo-500 hover:shadow-sm text-left p-2.5 rounded-xl transition-all"
            >
              <span className="text-[10px] font-bold text-slate-400 block uppercase leading-none">{item.department}</span>
              <span className="text-xs font-semibold text-slate-800 mt-1 line-clamp-1 block">{item.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h4 className="font-extrabold text-slate-800 text-sm">Dynamic Home Feed</h4>
          {loading && <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-2xl p-3 animate-pulse flex flex-col gap-2">
                <div className="w-full aspect-square bg-slate-100 rounded-xl"></div>
                <div className="h-4 bg-slate-100 rounded w-3/4 mt-1"></div>
                <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                <div className="h-8 bg-slate-100 rounded mt-3"></div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No products loaded. Pick onboarding items above.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {products.slice(0, 8).map((product) => (
              <ProductCard
                key={product.product_id}
                item={product}
                onProductClick={onProductClick}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
