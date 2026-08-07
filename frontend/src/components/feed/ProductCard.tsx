"use client";

import React from 'react';
import Link from 'next/link';
import { Star, ShoppingCart, ArrowRight } from 'lucide-react';
import { Product } from '@/lib/api';
import { XAIBadge } from './XAIBadge';
import { useClickstream } from '@/hooks/useClickstream';
import { useAppStore } from '@/store/useStore';

interface ProductCardProps {
  product: Product;
  onRefreshFeed?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onRefreshFeed }) => {
  const { trackClick, trackHoverStart, trackHoverEnd } = useClickstream();
  const addToCart = useAppStore((state) => state.addToCart);

  const handleClick = () => {
    trackClick(product.id);
    if (onRefreshFeed) {
      setTimeout(onRefreshFeed, 400); // Trigger feed refresh after intent update
    }
  };

  return (
    <div
      className="glass-panel glass-panel-hover rounded-xl overflow-hidden flex flex-col justify-between group"
      onMouseEnter={() => trackHoverStart(product.id)}
      onMouseLeave={() => trackHoverEnd(product.id)}
    >
      <div>
        {/* Product Image */}
        <div className="relative aspect-square w-full overflow-hidden bg-gray-900/50">
          <img
            src={product.image_url}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-gray-900/80 backdrop-blur-md text-[11px] font-semibold text-gray-300 border border-gray-700/50">
            {product.category}
          </div>
        </div>

        {/* Product Body */}
        <div className="p-4">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-semibold text-sm text-gray-100 line-clamp-1 group-hover:text-primary-500 transition-colors">
              {product.title}
            </h3>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-2 text-xs text-gray-400">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="font-medium text-gray-200">{product.rating}</span>
            <span>({product.review_count})</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-lg font-bold text-gray-100">₹{product.price.toLocaleString()}</span>
            {product.original_price && (
              <span className="text-xs text-gray-500 line-through">₹{product.original_price.toLocaleString()}</span>
            )}
          </div>

          {/* XAI Badge */}
          <XAIBadge explanation={product.xai_explanation} matchScore={product.match_score} />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 pt-0 flex items-center gap-2">
        <button
          onClick={() => {
            handleClick();
            addToCart(product);
          }}
          className="flex-1 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          Add to Cart
        </button>

        <Link
          href={`/product/${product.id}`}
          onClick={handleClick}
          className="py-2 px-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold flex items-center justify-center gap-1 transition-all"
        >
          View
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
