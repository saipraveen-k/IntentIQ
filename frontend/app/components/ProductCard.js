'use client';
import { Sparkles, ShoppingBag } from 'lucide-react';
import { useCart } from './CartContext';

export const getProductImage = (item) => {
  const dept = (item.department || '').toLowerCase().trim();
  const pid = item.product_id;
  
  let keyword = 'food';
  if (dept.includes('produce')) {
    keyword = 'fruit,vegetable';
  } else if (dept.includes('dairy') || dept.includes('eggs')) {
    keyword = 'dairy,cheese,milk';
  } else if (dept.includes('meat') || dept.includes('seafood') || dept.includes('fish')) {
    keyword = 'meat,fish';
  } else if (dept.includes('snack') || dept.includes('chips')) {
    keyword = 'snack,chips';
  } else if (dept.includes('beverage') || dept.includes('drink') || dept.includes('juice')) {
    keyword = 'drink,juice';
  } else if (dept.includes('bakery') || dept.includes('bread') || dept.includes('pastry')) {
    keyword = 'bread,pastry';
  } else if (dept.includes('pantry') || dept.includes('canned')) {
    keyword = 'cannedfood';
  }
  
  return `https://loremflickr.com/200/200/${keyword}?random=${pid}`;
};

import { useEffect } from 'react';
import { useEventLogger } from '../../hooks/useEventLogger';

export default function ProductCard({ item, onProductClick }) {
  const { addToCart } = useCart();
  const { logEvent } = useEventLogger();
  const pid = item.product_id;
  const name = item.name || `Product #${pid}`;
  const dept = item.department || 'Grocery';
  const price = typeof item.price === 'number' ? item.price : 0;
  
  const displayPrice = price.toFixed(2);
  const originalPrice = (price * 1.3).toFixed(2);
  
  // Custom explainability badge styling based on keyword
  const reason = item.reason || '🔥 Popular choice';
  let badgeColor = 'bg-indigo-50 text-indigo-600 border-indigo-100';
  if (reason.toLowerCase().includes('personalized') || reason.toLowerCase().includes('preferences')) {
    badgeColor = 'bg-indigo-50 text-indigo-600 border-indigo-100';
  } else if (reason.toLowerCase().includes('popular') || reason.toLowerCase().includes('trending') || reason.toLowerCase().includes('high click-through rate')) {
    badgeColor = 'bg-amber-50 text-amber-600 border-amber-100';
  } else if (reason.toLowerCase().includes('recommend') || reason.toLowerCase().includes('match')) {
    badgeColor = 'bg-emerald-50 text-emerald-600 border-emerald-100';
  }

  // Log view event on mount
  useEffect(() => {
    if (pid) {
      logEvent({
        productId: pid,
        eventType: 'view'
      });
    }
  }, [pid]);

  const handleProductClick = () => {
    logEvent({
      productId: pid,
      eventType: 'click'
    });
    onProductClick(pid);
  };

  const handleAddToCart = () => {
    logEvent({
      productId: pid,
      eventType: 'add_to_cart'
    });
    addToCart(item);
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-3 flex flex-col justify-between hover:shadow-md hover:-translate-y-1 transition-all duration-200 animate-fade-in group">
      
      {/* Product Image */}
      <div 
        onClick={handleProductClick}
        className="cursor-pointer relative overflow-hidden rounded-xl bg-slate-50 aspect-square border border-slate-50"
      >
        <img 
          src={getProductImage(item)} 
          alt={name} 
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          <span className="bg-white text-slate-800 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-slate-100">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Bundle details
          </span>
        </div>
      </div>

      {/* Product details */}
      <div className="mt-2.5 flex-1 flex flex-col">
        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block leading-none">{dept}</span>
        <h4 
          onClick={handleProductClick}
          className="text-xs sm:text-sm font-semibold text-slate-800 mt-1 cursor-pointer line-clamp-2 hover:text-indigo-600 leading-snug"
        >
          {name}
        </h4>
        
        {/* Explainability pill */}
        <div className={`mt-2 border px-2 py-0.5 rounded-md text-[9px] font-bold self-start flex items-center gap-1 ${badgeColor}`}>
          <span>{reason}</span>
        </div>

        {/* Pricing */}
        <div className="flex items-baseline gap-1.5 mt-2">
          <span className="text-sm font-black text-slate-800">₹{displayPrice}</span>
          <span className="text-[10px] text-slate-400 line-through">₹{originalPrice}</span>
        </div>
      </div>

      {/* Add CTA */}
      <button 
        onClick={handleAddToCart}
        className="mt-3 w-full bg-slate-50 hover:bg-indigo-600 text-indigo-600 hover:text-white border border-slate-100 hover:border-indigo-600 transition-all font-extrabold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5"
      >
        <ShoppingBag className="w-3.5 h-3.5" /> Add
      </button>
    </div>
  );
}
