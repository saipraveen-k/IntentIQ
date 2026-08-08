'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { X, ShoppingCart, Percent, Gift } from 'lucide-react';
import { useCart } from './CartContext';
import { getProductImage } from './ProductCard';

export default function BundleModal({ productId, onClose, apiUrl }) {
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [bundleData, setBundleData] = useState(null);

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
            { product_id: 13176, name: "Bag of Organic Bananas", price: 9.15, department: "produce", reason: "Frequently bought together" },
            { product_id: 47209, name: "Organic Hass Avocado", price: 8.20, department: "produce", reason: "Frequently bought together" },
            { product_id: 21137, name: "Organic Strawberries", price: 4.40, department: "produce", reason: "Popular in this aisle" }
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
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <Gift className="w-5 h-5 text-indigo-500" /> Complete the Look
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">Complementary products frequently bought together</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-800 p-1.5 rounded-full bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 no-scrollbar min-h-[200px]">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center animate-pulse gap-3">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-slate-500 font-semibold">Compiling recommended bundles...</span>
            </div>
          ) : !bundleData || !bundleData.bundle_items || bundleData.bundle_items.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">
              No bundling relations found for this product. Try another item.
            </div>
          ) : (
            bundleData.bundle_items.map((item) => (
              <div key={item.product_id} className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex gap-3 items-center animate-fade-in">
                <img 
                  src={getProductImage(item)} 
                  alt={item.name} 
                  className="w-12 h-12 rounded-xl object-cover border border-slate-100"
                />
                <div className="flex-1">
                  <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider leading-none block">
                    {item.department || 'Grocery'}
                  </span>
                  <h5 className="text-xs font-semibold text-slate-800 mt-0.5 line-clamp-1">{item.name}</h5>
                  <span className="text-[10px] text-slate-500 leading-relaxed block">{item.reason || 'Frequently bought together'}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-slate-800 block">₹{(item.price || 0).toFixed(2)}</span>
                  <button 
                    onClick={() => addToCart(item)}
                    className="mt-1 text-[10px] bg-white border border-slate-200 hover:border-indigo-600 hover:bg-indigo-600 hover:text-white text-indigo-600 font-bold px-2.5 py-1 rounded-lg transition-all"
                  >
                    + Add
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
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Bundle Total (Incl. 15% discount)</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-black text-emerald-600">
                  ₹{(bundleData.discounted_total || 0).toFixed(2)}
                </span>
                <span className="text-xs text-slate-400 line-through">
                  ₹{(bundleData.original_total || 0).toFixed(2)}
                </span>
                <span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5">
                  <Percent className="w-2.5 h-2.5" /> Save ₹{(bundleData.savings || 0).toFixed(2)}
                </span>
              </div>
            </div>
            <button 
              onClick={handleAddAll}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-600/15"
            >
              <ShoppingCart className="w-4 h-4" /> Add Bundle to Cart
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
