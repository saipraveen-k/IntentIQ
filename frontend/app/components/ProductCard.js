'use client';
import { useState, useEffect } from 'react';
import { Sparkles, ShoppingBag, Check, Heart, Star } from 'lucide-react';
import { useCart } from './CartContext';
import { getProductImage } from '../utils/productImages';
import { useEventLogger } from '../../hooks/useEventLogger';

export { getProductImage };

// Helper to sanitize technical XAI explanations into user-friendly shopper badges
const formatShopperBadge = (reasonText, item) => {
  if (!reasonText) return '🔥 Popular Pick';
  
  const text = reasonText.toLowerCase();
  
  if (text.includes('personalized') || text.includes('preference') || text.includes('profile')) {
    return '✨ Handpicked for You';
  }
  if (text.includes('organic') || text.includes('health') || text.includes('clean')) {
    return '🍏 Organic & Fresh';
  }
  if (text.includes('trending') || text.includes('popular') || text.includes('bestseller') || text.includes('high click')) {
    return '🔥 Customer Favorite';
  }
  if (text.includes('bought together') || text.includes('pairing') || text.includes('match') || text.includes('frequently')) {
    return '💡 Pairs Perfectly';
  }
  if (text.includes('delivery') || text.includes('fast') || text.includes('express')) {
    return '⚡ Express Delivery';
  }
  if (text.includes('deal') || text.includes('discount') || text.includes('value')) {
    return '🏷️ Great Value Deal';
  }
  
  // If raw string starts with technical metrics (e.g. "(95% confidence)"), clean it up
  const clean = reasonText.replace(/\(\d+%.*?\)/gi, '').trim();
  return clean ? `⭐ ${clean}` : '✨ Top Recommendation';
};

export default function ProductCard({ item, onProductClick }) {
  const { addToCart } = useCart();
  const { logEvent } = useEventLogger();
  const [added, setAdded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [imageError, setImageError] = useState(false);

  const pid = item.product_id || item.id;
  const name = item.name || item.title || `Product #${pid}`;
  const dept = item.department || item.category || 'Grocery';
  const price = typeof item.price === 'number' ? item.price : 0;
  const rating = item.rating || 4.8;
  
  const displayPrice = price.toFixed(2);
  const originalPrice = item.original_price 
    ? item.original_price.toFixed(2) 
    : (price * 1.25).toFixed(2);

  const badgeText = formatShopperBadge(item.xai_explanation || item.reason, item);

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

  const handleAddToCart = (e) => {
    e.stopPropagation();
    logEvent({
      productId: pid,
      eventType: 'add_to_cart'
    });
    addToCart(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  const imgSrc = imageError ? 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80' : getProductImage(item);

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-3 flex flex-col justify-between hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1.5 transition-all duration-300 animate-fade-in group relative overflow-hidden">
      
      {/* Wishlist Heart Button */}
      <button 
        onClick={(e) => { e.stopPropagation(); setIsLiked(!isLiked); }}
        className="absolute top-5 right-5 z-20 w-7 h-7 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-slate-400 hover:text-rose-500 shadow-sm border border-slate-100 transition-transform active:scale-90"
      >
        <Heart className={`w-3.5 h-3.5 transition-colors ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
      </button>

      {/* Product Image Container */}
      <div 
        onClick={handleProductClick}
        className="cursor-pointer relative overflow-hidden rounded-xl bg-slate-50 aspect-square border border-slate-100/60"
      >
        <img 
          src={imgSrc} 
          alt={name} 
          onError={() => setImageError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />
        
        {/* Hover quick bundle preview overlay */}
        <div className="absolute inset-0 bg-slate-900/15 opacity-0 group-hover:opacity-100 flex items-end justify-center p-2.5 transition-all duration-300">
          <span className="w-full bg-white/95 backdrop-blur-md text-slate-800 text-[11px] font-bold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 shadow-md border border-slate-100 transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Sparkles className="w-3 h-3 text-indigo-600 animate-pulse" /> Quick View & Bundles
          </span>
        </div>
      </div>

      {/* Product details */}
      <div className="mt-3 flex-1 flex flex-col">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider block leading-none">{dept}</span>
          <div className="flex items-center gap-0.5 text-amber-400 text-[10px] font-bold">
            <Star className="w-3 h-3 fill-amber-400" />
            <span className="text-slate-600">{rating}</span>
          </div>
        </div>

        <h4 
          onClick={handleProductClick}
          className="text-xs sm:text-sm font-bold text-slate-800 mt-1 cursor-pointer line-clamp-2 hover:text-indigo-600 transition-colors leading-snug"
        >
          {name}
        </h4>
        
        {/* User-Friendly Recommendation Badge */}
        <div className="mt-2.5 bg-gradient-to-r from-indigo-50/80 to-purple-50/50 border border-indigo-100/80 px-2.5 py-1 rounded-lg text-[10px] font-bold text-indigo-700 self-start flex items-center gap-1 shadow-2xs">
          <span>{badgeText}</span>
        </div>

        {/* Pricing */}
        <div className="flex items-baseline gap-1.5 mt-2.5">
          <span className="text-sm font-black text-slate-900">₹{displayPrice}</span>
          {parseFloat(originalPrice) > price && (
            <span className="text-[10px] text-slate-400 line-through">₹{originalPrice}</span>
          )}
        </div>
      </div>

      {/* Add CTA */}
      <button 
        onClick={handleAddToCart}
        className={`mt-3 w-full font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 shadow-sm active:scale-95 ${
          added 
            ? 'bg-emerald-600 text-white border border-emerald-600 shadow-emerald-500/20' 
            : 'bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white border border-indigo-100 hover:border-indigo-600 shadow-indigo-600/5 hover:shadow-indigo-600/20'
        }`}
      >
        {added ? (
          <>
            <Check className="w-4 h-4 animate-bounce" /> Added to Basket!
          </>
        ) : (
          <>
            <ShoppingBag className="w-3.5 h-3.5" /> Add to Basket
          </>
        )}
      </button>
    </div>
  );
}
