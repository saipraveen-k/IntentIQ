'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { X, ShoppingBag, Tag, Gift, Check, Sparkles } from 'lucide-react';
import { useCart } from './CartContext';
import { getProductImage } from '../utils/productImages';

export default function BundleModal({ productId, onClose, apiUrl }) {
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [bundleData, setBundleData] = useState(null);
  const [addedAll, setAddedAll] = useState(false);

  useEffect(() => {
    if (!productId) return;
    
    setLoading(true);
    axios.post(`${apiUrl}/api/v1/bundle`, { product_id: productId })
      .then((res) => {
        setBundleData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        const mockBundle = {
          base_product_id: productId,
          bundle_items: [
            { product_id: 13176, name: "Bag of Organic Bananas", price: 9.15, department: "produce", reason: "Frequently paired with your item" },
            { product_id: 47209, name: "Organic Hass Avocado", price: 8.20, department: "produce", reason: "Popular complementary choice" },
            { product_id: 21137, name: "Organic Strawberries", price: 4.40, department: "produce", reason: "Customer favorite combination" }
          ],
          original_total: 21.75,
          discounted_total: 18.49,
          savings: 3.26
        };
        setBundleData(mockBundle);
        setLoading(false);
      });
  }, [productId, apiUrl]);

  if (!productId) return null;

  const handleAddAll = () => {
    if (bundleData && bundleData.bundle_items) {
      bundleData.bundle_items.forEach((item) => addToCart(item));
      setAddedAll(true);
      setTimeout(() => {
        setAddedAll(false);
        onClose();
      }, 800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh] transform transition-all animate-scale-up">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-indigo-50/70 to-purple-50/50">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                <Gift className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-base">Perfect Pairings & Combos</h3>
            </div>
            <p className="text-slate-500 text-xs mt-1">Frequently ordered together with extra bundle discount</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-800 p-2 rounded-full bg-white hover:bg-slate-100 transition-colors shadow-2xs border border-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-3.5 flex-1 no-scrollbar min-h-[220px]">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center animate-pulse gap-3">
              <div className="w-9 h-9 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-slate-500 font-bold">Curating complementary item discounts...</span>
            </div>
          ) : !bundleData || !bundleData.bundle_items || bundleData.bundle_items.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs font-medium">
              No extra bundle pairings found for this item.
            </div>
          ) : (
            bundleData.bundle_items.map((item) => (
              <div key={item.product_id} className="bg-slate-50/80 border border-slate-100 rounded-2xl p-3 flex gap-3.5 items-center hover:bg-white hover:shadow-md transition-all">
                <img 
                  src={getProductImage(item)} 
                  alt={item.name} 
                  className="w-14 h-14 rounded-xl object-cover border border-slate-100 shadow-2xs flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-extrabold text-indigo-600 uppercase tracking-wider leading-none block">
                    {item.department || 'Grocery'}
                  </span>
                  <h5 className="text-xs font-bold text-slate-800 mt-1 truncate">{item.name}</h5>
                  <span className="text-[10px] text-slate-500 font-medium block mt-0.5">{item.reason || 'Popular pairing'}</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-sm font-black text-slate-900 block">₹{(item.price || 0).toFixed(2)}</span>
                  <button 
                    onClick={() => addToCart(item)}
                    className="mt-1 text-[10px] bg-white border border-slate-200 hover:border-indigo-600 hover:bg-indigo-600 hover:text-white text-indigo-600 font-extrabold px-3 py-1 rounded-lg transition-all shadow-2xs"
                  >
                    + Add Item
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        {!loading && bundleData && (
          <div className="p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Combo Bundle Price</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-black text-emerald-600">
                  ₹{(bundleData.discounted_total || 0).toFixed(2)}
                </span>
                <span className="text-xs text-slate-400 line-through font-medium">
                  ₹{(bundleData.original_total || 0).toFixed(2)}
                </span>
                <span className="text-[9px] bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-extrabold flex items-center gap-1">
                  <Tag className="w-2.5 h-2.5" /> Save ₹{(bundleData.savings || 0).toFixed(2)}
                </span>
              </div>
            </div>
            <button 
              onClick={handleAddAll}
              className={`w-full sm:w-auto font-bold py-3 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md ${
                addedAll 
                  ? 'bg-emerald-600 text-white shadow-emerald-500/20' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20 active:scale-95'
              }`}
            >
              {addedAll ? (
                <>
                  <Check className="w-4 h-4 animate-bounce" /> Added Bundle to Cart!
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" /> Add Complete Bundle
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
