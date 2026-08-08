'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, ShoppingBag, Info, Star, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { Product } from '../../lib/api';
import { useStore } from '../../store/useStore';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, activeIntentLabel } = useStore();
  const [showXAI, setShowXAI] = useState(false);
  const [imgSrc, setImgSrc] = useState(product.image_url);

  const matchPct = product.match_score ? Math.round(product.match_score * 100) : 96;
  const isFBT = product.review_count > 350;
  const isTrending = product.rating >= 4.8;
  const isColdStart = product.review_count < 150;

  return (
    <div className="card-elevated overflow-hidden flex flex-col justify-between group bg-white">
      
      {/* Top Image & Badges */}
      <div className="relative w-full h-56 bg-gray-100 overflow-hidden">
        <img
          src={imgSrc}
          alt={product.title}
          onError={() => setImgSrc('https://images.unsplash.com/photo-1542838132-92c53300491e?w=600')}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Top Floating Match Score Pill */}
        <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-700 shadow-sm flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>{matchPct}% match</span>
        </div>

        {/* Badge Overlay */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
          {isTrending && (
            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold">
              Trending
            </span>
          )}
          {isFBT && (
            <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold">
              Popular
            </span>
          )}
          {isColdStart && (
            <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-[10px] font-semibold">
              New
            </span>
          )}
        </div>

        {/* Category Pill */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-[11px] font-medium text-gray-600 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
          <span>{product.category}</span>
          {product.sub_category && (
            <>
              <span className="text-gray-300">•</span>
              <span className="text-blue-600">{product.sub_category}</span>
            </>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        
        <div>
          <Link href={`/product/${product.id}`} className="group-hover:text-blue-600 transition-colors">
            <h3 className="font-semibold text-base text-gray-900 line-clamp-1">{product.title}</h3>
          </Link>
          <p className="text-sm text-gray-500 line-clamp-2 mt-1 leading-relaxed">
            {product.description || `Fresh item in ${product.category}.`}
          </p>
        </div>

        {/* Price & Rating */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-gray-900">₹{product.price.toFixed(2)}</span>
              {product.original_price && (
                <span className="text-sm text-gray-400 line-through">₹{product.original_price.toFixed(2)}</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-sm text-amber-500 mt-0.5">
              <Star className="w-3.5 h-3.5 fill-amber-500" />
              <span className="font-medium text-gray-700">{product.rating.toFixed(1)}</span>
              <span className="text-gray-400">({product.review_count})</span>
            </div>
          </div>

          <button
            onClick={() => addToCart(product)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-black hover:bg-gray-800 text-white font-medium text-sm transition-all active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            Add
          </button>
        </div>

        {/* AI Confidence & XAI Section */}
        <div className="pt-3 border-t border-gray-100 space-y-3">
          {/* AI Confidence Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 font-medium">AI confidence</span>
              <span className="text-blue-600 font-semibold">{matchPct}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${matchPct}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => setShowXAI(!showXAI)}
            className="w-full flex items-center justify-between text-xs font-medium text-gray-500 hover:text-blue-600 py-1 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md outline-none"
            aria-expanded={showXAI}
            aria-label="Toggle recommendation explanation"
          >
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              Why this recommendation?
            </span>
            {showXAI ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showXAI && (
            <div className="p-4 rounded-xl bg-gray-50 text-xs text-gray-600 space-y-3 animate-fadeIn">
              <p className="font-medium text-gray-800 leading-relaxed">
                "{product.structured_xai?.primary_reason || product.xai_explanation || `Matches your ${activeIntentLabel} preferences.`}"
              </p>
              
              {/* Supporting Signals List */}
              {product.structured_xai?.supporting_signals && (
                <div className="pt-2 border-t border-gray-200 space-y-1.5">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">
                    Why we think you'll like this
                  </span>
                  <ul className="space-y-1 text-[11px] text-gray-600">
                    {product.structured_xai.supporting_signals.map((sig, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-blue-500 shrink-0" />
                        <span>{sig}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sub-Score Breakdown */}
              {product.score_breakdown && (
                <div className="pt-2 border-t border-gray-200 space-y-1.5">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">
                    Match factors
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Similarity</span>
                      <span className="font-medium text-blue-600">{Math.round(product.score_breakdown.semantic * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Popularity</span>
                      <span className="font-medium text-emerald-600">{Math.round(product.score_breakdown.graph * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Intent</span>
                      <span className="font-medium text-indigo-600">{Math.round(product.score_breakdown.intent * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Budget</span>
                      <span className="font-medium text-amber-600">{Math.round(product.score_breakdown.budget * 100)}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
