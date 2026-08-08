'use client';
import { X, ShoppingBasket, Trash2, Plus, Minus, CreditCard, Sparkles, CheckCircle2 } from 'lucide-react';
import { useCart } from './CartContext';
import { getProductImage } from '../utils/productImages';
import { useState } from 'react';

export default function CartDrawer({ isOpen, onClose }) {
  const { cart, addToCart, removeFromCart, clearCart, totalItems, totalPrice } = useCart();
  const [orderPlaced, setOrderPlaced] = useState(false);

  if (!isOpen) return null;

  const handleCheckout = () => {
    setOrderPlaced(true);
    setTimeout(() => {
      clearCart();
      setOrderPlaced(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex justify-end">
      {/* Background click to close */}
      <div className="absolute inset-0 z-0" onClick={onClose}></div>

      {/* Drawer Panel */}
      <div className="relative z-10 w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right border-l border-slate-100">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <ShoppingBasket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Shopping Basket</h3>
              <p className="text-slate-500 text-xs font-medium mt-0.5">{totalItems} items selected</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 p-2 rounded-full bg-white hover:bg-slate-100 transition-colors border border-slate-100 shadow-2xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable list of items */}
        <div className="p-5 overflow-y-auto space-y-3.5 flex-1 no-scrollbar">
          {orderPlaced ? (
            <div className="py-24 text-center flex flex-col items-center justify-center text-emerald-600 gap-3 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-200 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>
              <h4 className="text-base font-black text-slate-800">Order Placed Successfully!</h4>
              <p className="text-xs text-slate-500 max-w-xs">Your fresh order is being packed and prepared for express delivery.</p>
            </div>
          ) : totalItems === 0 ? (
            <div className="py-24 text-center flex flex-col items-center justify-center text-slate-400 gap-3">
              <ShoppingBasket className="w-12 h-12 text-slate-300 stroke-1" />
              <span className="text-sm font-bold text-slate-700">Your basket is currently empty</span>
              <p className="text-xs text-slate-400 max-w-xs">Explore fresh deals and add items to get started!</p>
            </div>
          ) : (
            Object.values(cart).map((item) => (
              <div key={item.product_id} className="flex items-center justify-between bg-slate-50/60 border border-slate-100 rounded-2xl p-3 hover:bg-white transition-all">
                <img 
                  src={getProductImage(item)} 
                  alt={item.name} 
                  className="w-12 h-12 rounded-xl object-cover border border-slate-100 flex-shrink-0"
                />
                <div className="flex-1 min-w-0 px-3">
                  <h5 className="text-xs font-bold text-slate-800 truncate">
                    {item.name || `Product #${item.product_id}`}
                  </h5>
                  <span className="text-[10px] font-semibold text-slate-500 mt-0.5 block">
                    ₹{(item.price || 0).toFixed(2)} each
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <button 
                      onClick={() => removeFromCart(item.product_id)}
                      className="px-2 py-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      aria-label="Decrease item count"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-2 text-xs font-extrabold text-slate-800">{item.count}</span>
                    <button 
                      onClick={() => addToCart(item)}
                      className="px-2 py-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      aria-label="Increase item count"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-xs font-black text-slate-900 min-w-[55px] text-right">
                    ₹{((item.price || 0) * item.count).toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {totalItems > 0 && !orderPlaced && (
          <div className="p-5 border-t border-slate-100 bg-slate-50/80 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Subtotal Amount:</span>
              <span className="text-xl font-black text-slate-900">₹{totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex gap-2.5">
              <button 
                onClick={clearCart}
                className="flex-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 py-3.5 rounded-2xl font-bold transition-all text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-95"
              >
                <Trash2 className="w-4 h-4 text-slate-400" /> Clear
              </button>
              <button 
                onClick={handleCheckout}
                className="flex-2 flex-grow bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-extrabold transition-all text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95"
              >
                <CreditCard className="w-4 h-4" /> Place Express Order
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
