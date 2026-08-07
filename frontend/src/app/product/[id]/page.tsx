'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Star, ShoppingBag, CheckCircle2, Package, Heart, Crown, ShieldCheck } from 'lucide-react';
import { api, BundleResponse, Product } from '../../../lib/api';
import { useStore } from '../../../store/useStore';
import { ProductCard } from '../../../components/feed/ProductCard';
import { AIBrainPanel } from '../../../components/brain/AIBrainPanel';

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  const { addToCart, activeIntentLabel } = useStore();

  const [bundleData, setBundleData] = useState<BundleResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const data = await api.getBundle(productId);
        setBundleData(data);
      } catch (e) {
        console.warn('Bundle detail notice:', e);
      } finally {
        setLoading(false);
      }
    };
    if (productId) fetchDetails();
  }, [productId]);

  if (loading) {
    return (
      <div className="bg-white p-12 rounded-3xl text-center text-gray-400 animate-shimmer space-y-4 border border-gray-200">
        <Sparkles className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
        <p className="text-sm font-semibold">Retrieving Instacart Product Metadata...</p>
      </div>
    );
  }

  const product = bundleData?.base_product;
  if (!product) {
    return (
      <div className="bg-white p-12 rounded-3xl text-center space-y-4 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Product Not Found</h2>
        <Link href="/" className="px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-full inline-block">
          Return Home
        </Link>
      </div>
    );
  }

  const completeLook = bundleData?.complete_the_look || [];
  const frequentlyBought = bundleData?.frequently_bought_together || [];
  const rawBundled = [...completeLook, ...frequentlyBought];
  const allBundled = Array.from(new Map(rawBundled.map((p) => [p.id, p])).values());

  return (
    <div className="space-y-16 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      
      {/* Navigation */}
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Storefront
      </Link>

      {/* Main Product Hero Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left Column: Image Gallery Grid (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative w-full h-[480px] rounded-3xl bg-gray-50 overflow-hidden border border-gray-200/80 shadow-sm">
            <img
              src={product.image_url}
              alt={product.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4">
              <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#D7ECFF] text-[#1E40AF] shadow-sm inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Highly Recommended
              </span>
            </div>
          </div>

          {/* Product Story Card */}
          <div className="bg-white p-8 rounded-3xl border border-gray-200/80 shadow-sm space-y-3">
            <h3 className="font-extrabold text-lg text-gray-900">Product Story & Quality Assurance</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {product.description || `Freshly sourced item in department ${product.category}. Verified with Instacart store inventory graphs.`}
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
              <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Freshness Guaranteed
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <ShieldCheck className="w-4 h-4" /> DPDP 2023 Compliant
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Buy Panel (5 Cols) */}
        <div className="lg:col-span-5 sticky top-24 space-y-6 bg-white p-8 rounded-3xl border border-gray-200/80 shadow-sm">
          
          <div className="space-y-3">
            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">
              {product.category}
            </span>

            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">{product.title}</h1>

            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{product.rating.toFixed(1)}</span>
              </div>
              <span className="text-gray-400">({product.review_count} reviews)</span>
            </div>
          </div>

          {/* Pricing & Add Button */}
          <div className="border-t border-b border-gray-100 py-6 space-y-4">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-extrabold text-gray-900">₹{product.price.toFixed(2)}</span>
              {product.original_price && (
                <span className="text-base text-gray-400 line-through">₹{product.original_price.toFixed(2)}</span>
              )}
            </div>

            <button
              onClick={() => addToCart(product)}
              className="w-full py-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              Add to Basket
            </button>
          </div>

          {/* AI Compatibility Callout */}
          <div className="p-4 rounded-2xl bg-[#D7ECFF]/40 border border-[#BFDBFE] text-xs text-[#1E40AF] space-y-1">
            <span className="font-bold block">Match Confidence</span>
            <p className="text-gray-700 leading-relaxed">
              Curated for active <span className="font-semibold">{activeIntentLabel}</span> intent based on Instacart basket co-occurrence.
            </p>
          </div>

        </div>

      </div>

      {/* COMPLETE THE BASKET BUNDLES */}
      {allBundled.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-200/80 pb-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-700" />
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Pairs Well With This Item</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {allBundled.map((bundledProd) => (
              <ProductCard key={bundledProd.id} product={bundledProd} />
            ))}
          </div>
        </section>
      )}

      {/* SHOPPING INTELLIGENCE DRAWER (COLLAPSED) */}
      <section className="space-y-4">
        <AIBrainPanel />
      </section>

    </div>
  );
}

