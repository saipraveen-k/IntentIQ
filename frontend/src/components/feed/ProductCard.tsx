'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Star, Sparkles } from 'lucide-react';
import { Product } from '../../lib/api';
import { useStore } from '../../store/useStore';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useStore();
  const [imgSrc, setImgSrc] = useState(product.image_url);

  const matchPct = product.match_score ? Math.round(product.match_score * 100) : 92;

  // Derive human pastel badge label
  let pastelBadge = { label: 'Recommended for You', class: 'bg-[#D7ECFF] text-[#1E40AF]' };
  if (matchPct >= 95) {
    pastelBadge = { label: 'Highly Compatible', class: 'bg-[#DCCEF9] text-[#4C1D95]' };
  } else if (product.category.includes('Produce') || product.title.includes('Organic')) {
    pastelBadge = { label: 'Healthy Pick', class: 'bg-[#DFF7E2] text-[#065F46]' };
  } else if (product.review_count > 300) {
    pastelBadge = { label: 'Popular Choice', class: 'bg-[#FFF3C4] text-[#854D0E]' };
  } else if (product.price <= 35) {
    pastelBadge = { label: 'Great Value', class: 'bg-[#FFE7D6] text-[#9A3412]' };
  }

  return (
    <div className="bg-white rounded-3xl overflow-hidden flex flex-col justify-between group border border-gray-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      
      {/* Top Image Container */}
      <div className="relative w-full h-56 bg-gray-50 overflow-hidden">
        <img
          src={imgSrc}
          alt={product.title}
          onError={() => setImgSrc('https://images.unsplash.com/photo-1542838132-92c53300491e?w=600')}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Floating Pastel Badge */}
        <div className="absolute top-3.5 left-3.5">
          <span className={`px-3 py-1 rounded-full text-[11px] font-bold shadow-sm inline-flex items-center gap-1.5 ${pastelBadge.class}`}>
            <Sparkles className="w-3 h-3" />
            {pastelBadge.label}
          </span>
        </div>

        {/* Category Tag */}
        <div className="absolute bottom-3.5 left-3.5 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-gray-200/60 text-[11px] font-semibold text-gray-700">
          {product.category}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <Link href={`/product/${product.id}`} className="group-hover:text-slate-900 transition-colors">
            <h3 className="font-bold text-base text-gray-900 line-clamp-1">{product.title}</h3>
          </Link>
          <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
            {product.description || `Instacart curated product in category ${product.category}.`}
          </p>
        </div>

        {/* Price & Add Button */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-3.5">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-extrabold text-gray-900">₹{product.price.toFixed(2)}</span>
              {product.original_price && (
                <span className="text-xs text-gray-400 line-through">₹{product.original_price.toFixed(2)}</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-amber-500 mt-0.5">
              <Star className="w-3 h-3 fill-amber-400" />
              <span className="font-semibold text-gray-700">{product.rating.toFixed(1)}</span>
              <span className="text-gray-400">({product.review_count})</span>
            </div>
          </div>

          <button
            onClick={() => addToCart(product)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm transition-all active:scale-95"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Add
          </button>
        </div>

      </div>

    </div>
  );
};

