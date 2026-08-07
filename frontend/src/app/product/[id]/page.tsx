"use client";

import React, { useEffect, useState, use } from 'react';
import { ShoppingCart, Star, Sparkles, Layers, PackageCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { api, BundleResponse, Product } from '@/lib/api';
import { useAppStore } from '@/store/useStore';
import { ProductCard } from '@/components/feed/ProductCard';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  const addToCart = useAppStore((state) => state.addToCart);

  const [bundleData, setBundleData] = useState<BundleResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBundle() {
      setLoading(true);
      try {
        const data = await api.getBundle(productId);
        setBundleData(data);
      } catch (e) {
        console.error("Bundle error", e);
      } finally {
        setLoading(false);
      }
    }
    loadBundle();
  }, [productId]);

  if (loading || !bundleData) {
    return <div className="text-gray-400 text-sm p-8 text-center animate-pulse">Loading Product & Bundle Engine...</div>;
  }

  const { base_product, complete_the_look, frequently_bought_together, bundle_discount_pct, original_total, discounted_total } = bundleData;

  const handleAddBundleToCart = () => {
    addToCart(base_product);
    complete_the_look.forEach((p) => addToCart(p));
  };

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Personalized Feed
      </Link>

      {/* Main Product Showcase */}
      <div className="glass-panel p-6 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-8 border border-gray-800">
        {/* Left: Product Image */}
        <div className="aspect-square rounded-xl overflow-hidden bg-gray-900 border border-gray-800">
          <img src={base_product.image_url} alt={base_product.title} className="w-full h-full object-cover" />
        </div>

        {/* Right: Info */}
        <div className="flex flex-col justify-between">
          <div>
            <span className="px-2.5 py-1 rounded-md bg-indigo-950/60 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
              {base_product.category}
            </span>
            <h1 className="text-2xl font-bold text-white mt-3 mb-2">{base_product.title}</h1>
            
            <div className="flex items-center gap-2 mb-4 text-xs text-gray-400">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-bold text-gray-200">{base_product.rating}</span>
              <span>({base_product.review_count} verified reviews)</span>
            </div>

            <p className="text-sm text-gray-300 mb-6 leading-relaxed">
              {base_product.description}
            </p>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-extrabold text-white">₹{base_product.price.toLocaleString()}</span>
              {base_product.original_price && (
                <span className="text-sm text-gray-500 line-through">₹{base_product.original_price.toLocaleString()}</span>
              )}
            </div>
          </div>

          <button
            onClick={() => addToCart(base_product)}
            className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            Add Single Product to Cart
          </button>
        </div>
      </div>

      {/* COMPLETE THE LOOK BUNDLE WIDGET (AI BUNDLE AGENT) */}
      <div className="glass-panel p-6 rounded-2xl border border-indigo-500/40 bg-gradient-to-br from-indigo-950/40 via-gray-900 to-gray-900 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-indigo-500/20 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-accent-cyan" />
              <h2 className="text-lg font-bold text-white">Complete the Look — Intent Bundle</h2>
            </div>
            <p className="text-xs text-indigo-300">
              AI Bundle Agent visual pairing (Save {bundle_discount_pct}% when bought as a set)
            </p>
          </div>

          <button
            onClick={handleAddBundleToCart}
            className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-indigo-600 via-accent-purple to-accent-cyan text-gray-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all hover:scale-105"
          >
            <PackageCheck className="w-4 h-4" />
            Add Entire Bundle to Cart (Save ₹{(original_total - discounted_total).toFixed(0)})
          </button>
        </div>

        {/* Bundle Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Base Product Card */}
          <div className="p-3 rounded-xl bg-gray-900/80 border border-indigo-500/30 flex items-center gap-3">
            <img src={base_product.image_url} alt={base_product.title} className="w-16 h-16 rounded-lg object-cover" />
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-400">Selected Item</span>
              <h4 className="text-xs font-semibold text-gray-200 line-clamp-1">{base_product.title}</h4>
              <p className="text-xs font-bold text-gray-100 mt-1">₹{base_product.price.toLocaleString()}</p>
            </div>
          </div>

          {/* Complementary Item 1 */}
          {complete_the_look[0] && (
            <div className="p-3 rounded-xl bg-gray-900/80 border border-gray-800 flex items-center gap-3">
              <img src={complete_the_look[0].image_url} alt={complete_the_look[0].title} className="w-16 h-16 rounded-lg object-cover" />
              <div>
                <span className="text-[10px] uppercase font-bold text-accent-cyan">Complementary Pair</span>
                <h4 className="text-xs font-semibold text-gray-200 line-clamp-1">{complete_the_look[0].title}</h4>
                <p className="text-xs font-bold text-gray-100 mt-1">₹{complete_the_look[0].price.toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* Complementary Item 2 */}
          {complete_the_look[1] && (
            <div className="p-3 rounded-xl bg-gray-900/80 border border-gray-800 flex items-center gap-3">
              <img src={complete_the_look[1].image_url} alt={complete_the_look[1].title} className="w-16 h-16 rounded-lg object-cover" />
              <div>
                <span className="text-[10px] uppercase font-bold text-accent-cyan">Complementary Pair</span>
                <h4 className="text-xs font-semibold text-gray-200 line-clamp-1">{complete_the_look[1].title}</h4>
                <p className="text-xs font-bold text-gray-100 mt-1">₹{complete_the_look[1].price.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
