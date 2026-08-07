'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, ShoppingBag, Info, Star, ShieldCheck, Tag, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
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
    <div className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between group border border-white/10 hover:border-blue-500/40 transition-all duration-300">
      
      {/* Top Image & Badges */}
      <div className="relative w-full h-52 bg-slate-900 overflow-hidden">
        <img
          src={imgSrc}
          alt={product.title}
          onError={() => setImgSrc('https://images.unsplash.com/photo-1542838132-92c53300491e?w=600')}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#131A2B] via-transparent to-transparent opacity-80" />

        {/* Top Floating Match Score Pill */}
        <div className="absolute top-3 left-3 glass-pill px-2.5 py-1 rounded-full text-xs font-bold text-emerald-400 border border-emerald-400/30 flex items-center gap-1 shadow-lg">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{matchPct}% Match</span>
        </div>

        {/* Badge Overlay */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
          {isTrending && (
            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
              🔥 Trending
            </span>
          )}
          {isFBT && (
            <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
              📦 Frequently Bought
            </span>
          )}
          {isColdStart && (
            <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
              ✨ Discover New
            </span>
          )}
        </div>

        {/* Category Pill */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-[11px] font-semibold text-slate-300 bg-slate-950/80 px-2.5 py-1 rounded-md border border-white/10 backdrop-blur-md">
          <span>{product.category}</span>
          {product.sub_category && (
            <>
              <span className="text-slate-500">•</span>
              <span className="text-blue-400">{product.sub_category}</span>
            </>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        
        <div>
          <Link href={`/product/${product.id}`} className="group-hover:text-blue-400 transition-colors">
            <h3 className="font-bold text-base text-white line-clamp-1">{product.title}</h3>
          </Link>
          <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
            {product.description || `Instacart fresh item in department ${product.category}.`}
          </p>
        </div>

        {/* Price & Rating */}
        <div className="flex items-center justify-between border-t border-white/5 pt-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-extrabold text-white">₹{product.price.toFixed(2)}</span>
              {product.original_price && (
                <span className="text-xs text-slate-500 line-through">₹{product.original_price.toFixed(2)}</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-amber-400 mt-0.5">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span className="font-semibold text-slate-200">{product.rating.toFixed(1)}</span>
              <span className="text-slate-500">({product.review_count})</span>
            </div>
          </div>

          <button
            onClick={() => addToCart(product)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md shadow-blue-500/20 active:scale-95"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Add
          </button>
        </div>

        {/* Section 3: "Why This Recommendation?" XAI Drawer Toggle & Signals */}
        <div className="border-t border-white/5 pt-2 space-y-2">
          {/* AI Confidence Progress Bar & Label */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-medium">AI Confidence</span>
              <span className="text-emerald-400 font-mono font-bold">{matchPct}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${matchPct}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => setShowXAI(!showXAI)}
            className="w-full flex items-center justify-between text-xs font-medium text-slate-300 hover:text-blue-400 py-1 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md outline-none"
            aria-expanded={showXAI}
            aria-label="Toggle recommendation explanation"
          >
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-400" />
              Why this recommendation?
            </span>
            {showXAI ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showXAI && (
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-2.5 animate-fadeIn">
              <p className="font-medium text-slate-200 leading-relaxed italic">
                "{product.structured_xai?.primary_reason || product.xai_explanation || `Matches active ${activeIntentLabel} intent.`}"
              </p>
              
              {/* Supporting Signals List */}
              {product.structured_xai?.supporting_signals && (
                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Evidence Signals
                  </span>
                  <ul className="space-y-0.5 text-[11px] text-slate-300">
                    {product.structured_xai.supporting_signals.map((sig, idx) => (
                      <li key={idx} className="flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                        <span className="text-slate-300">{sig}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sub-Score Breakdown */}
              {product.score_breakdown && (
                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Decision Sub-Scores
                  </span>
                  <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-300">
                    <div>Sim: <span className="text-blue-400">{Math.round(product.score_breakdown.semantic * 100)}%</span></div>
                    <div>Graph: <span className="text-emerald-400">{Math.round(product.score_breakdown.graph * 100)}%</span></div>
                    <div>Intent: <span className="text-indigo-400">{Math.round(product.score_breakdown.intent * 100)}%</span></div>
                    <div>Budget: <span className="text-amber-400">{Math.round(product.score_breakdown.budget * 100)}%</span></div>
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
