'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Gift, Percent, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from '../CartContext';
import { getProductImage } from '../ProductCard';

export default function BundleWidget({ productId, apiUrl }) {
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [bundle, setBundle] = useState(null);

  useEffect(() => {
    if (!productId) {
      // Default bundle mock for bananas
      setBundle({
        base_product_id: 13176,
        bundle_items: [
          { product_id: 13176, name: "Bag of Organic Bananas", price: 9.15, department: "produce", reason: "Frequently bought together" },
          { product_id: 47209, name: "Organic Hass Avocado", price: 8.20, department: "produce", reason: "Best pairing choice" },
          { product_id: 21137, name: "Organic Strawberries", price: 4.40, department: "produce", reason: "Popular fruit bundle" }
        ],
        original_total: 21.75,
        discounted_total: 18.49,
        savings: 3.26
      });
      return;
    }

    setLoading(true);
    axios.post(`${apiUrl}/api/v1/bundle`, { product_id: productId })
      .then((res) => {
        setBundle(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setBundle({
          base_product_id: productId,
          bundle_items: [
            { product_id: productId, name: "Selected Catalog Item", price: 7.50, department: "grocery", reason: "Base item query" },
            { product_id: 13176, name: "Bag of Organic Bananas", price: 9.15, department: "produce", reason: "Frequently bought together" },
            { product_id: 47209, name: "Organic Hass Avocado", price: 8.20, department: "produce", reason: "Best pairing choice" }
          ],
          original_total: 24.85,
          discounted_total: 21.12,
          savings: 3.73
        });
        setLoading(false);
      });
  }, [productId, apiUrl]);

  const handleAddAll = () => {
    if (bundle && bundle.bundle_items) {
      bundle.bundle_items.forEach((item) => addToCart(item));
      alert('Added all bundle items to your basket!');
    }
  };

  if (!bundle) return null;

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
          <Gift className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-extrabold text-slate-800 text-sm">"Complete the Look" Bundle Deal</h4>
          <p className="text-slate-400 text-[10px] mt-0.5">Apriori mined itemset pairs & package discounts</p>
        </div>
      </div>

      {loading ? (
        <div className="h-24 bg-slate-50 border border-slate-100 animate-pulse rounded-2xl flex items-center justify-center text-xs text-slate-400 font-semibold">
          Recalculating items association sets...
        </div>
      ) : (
        <div className="space-y-4">
          {/* Bundle Items grid list */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {bundle.bundle_items.map((item) => (
              <div key={item.product_id} className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex sm:flex-col items-center sm:text-center justify-between gap-2.5">
                <div className="flex items-center sm:flex-col gap-2.5">
                  <img
                    src={getProductImage(item)}
                    alt={item.name}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover border border-slate-100"
                  />
                  <div>
                    <h5 className="text-[11px] font-bold text-slate-800 line-clamp-1">{item.name}</h5>
                    <span className="text-[9px] text-slate-400 block leading-tight">{item.reason || 'Frequently bought'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-black text-slate-800">₹{(item.price || 0).toFixed(2)}</span>
                  <button
                    onClick={() => {
                      addToCart(item);
                      alert(`Added ${item.name} to cart!`);
                    }}
                    className="p-1 bg-white hover:bg-indigo-600 text-indigo-600 hover:text-white border border-slate-200 hover:border-indigo-600 rounded-lg transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing summary */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">AOV Impact Total (15% Savings)</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-lg font-black text-emerald-600">₹{(bundle.discounted_total || 0).toFixed(2)}</span>
                <span className="text-xs text-slate-400 line-through">₹{(bundle.original_total || 0).toFixed(2)}</span>
                <span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5 leading-none">
                  <Percent className="w-2.5 h-2.5" /> Save ₹{(bundle.savings || 0).toFixed(2)}
                </span>
              </div>
            </div>
            <button
              onClick={handleAddAll}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3 px-5 rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1.5"
            >
              <ShoppingBag className="w-4 h-4" /> Add Full Bundle to Cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
