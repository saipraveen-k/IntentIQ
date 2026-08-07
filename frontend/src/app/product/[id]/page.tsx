'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Star, ShoppingBag, CheckCircle2, ShieldCheck, Tag, Info, Package, Layers } from 'lucide-react';
import { api, BundleResponse, Product } from '../../../lib/api';
import { useStore } from '../../../store/useStore';
import { ProductCard } from '../../../components/feed/ProductCard';

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
      <div className="glass-panel p-12 rounded-3xl text-center text-slate-400 animate-pulse space-y-4">
        <Sparkles className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
        <p className="text-sm font-semibold">Retrieving Instacart Product Metadata & Bundle Graph...</p>
      </div>
    );
  }

  const product = bundleData?.base_product;
  if (!product) {
    return (
      <div className="glass-panel p-12 rounded-3xl text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Product Not Found</h2>
        <Link href="/" className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl inline-block">
          Return Home
        </Link>
      </div>
    );
  }

  const completeLook = bundleData?.complete_the_look || [];
  const frequentlyBought = bundleData?.frequently_bought_together || [];
  const allBundled = [...completeLook, ...frequentlyBought];

  return (
    <div className="space-y-12">
      
      {/* Navigation */}
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to AI Discovery
      </Link>

      {/* Main Product Hero Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 glass-panel p-6 lg:p-10 rounded-3xl border border-white/10 shadow-2xl">
        
        {/* Large Product Hero Image */}
        <div className="relative w-full h-96 lg:h-[420px] rounded-2xl bg-slate-900 overflow-hidden border border-white/10">
          <img
            src={product.image_url}
            alt={product.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 glass-pill px-3 py-1 rounded-full text-xs font-bold text-emerald-400 border border-emerald-400/30 flex items-center gap-1.5 shadow-lg">
            <Sparkles className="w-4 h-4" />
            <span>98% Intent Match</span>
          </div>
        </div>

        {/* Product Details & Actions */}
        <div className="flex flex-col justify-between space-y-6">
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Department: {product.category}
              </span>
              {product.sub_category && (
                <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-white/10">
                  Aisle: {product.sub_category}
                </span>
              )}
            </div>

            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">{product.title}</h1>

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1 text-amber-400 font-bold">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{product.rating.toFixed(1)}</span>
                <span className="text-slate-500 font-normal">({product.review_count} reviews)</span>
              </div>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Instacart Verified Stock
              </span>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed pt-2">
              {product.description || `Sourced from Instacart ${product.category} department.`}
            </p>
          </div>

          {/* Pricing & Add Button */}
          <div className="border-t border-white/10 pt-4 space-y-4">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-white">₹{product.price.toFixed(2)}</span>
              {product.original_price && (
                <span className="text-sm text-slate-500 line-through">₹{product.original_price.toFixed(2)}</span>
              )}
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                15% Bundle Savings Eligible
              </span>
            </div>

            <button
              onClick={() => addToCart(product)}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              <ShoppingBag className="w-4 h-4" />
              Add Product To Instacart Basket
            </button>
          </div>

          {/* Customer Journey Insight Card */}
          <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/20 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-blue-400">
              <Info className="w-4 h-4" /> Customer Journey Insight
            </div>
            <p className="text-slate-300 leading-relaxed">
              Customers viewing {product.title} in {product.category} frequently add complementary aisle items within 45 seconds of session initiation.
            </p>
          </div>

        </div>

      </div>

      {/* COMPLETE THE BASKET BUNDLES */}
      {allBundled.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-bold text-white">Complete The Basket Bundles</h2>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Save 15% Extra When Bought Together
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {allBundled.map((bundledProd) => (
              <ProductCard key={bundledProd.id} product={bundledProd} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
