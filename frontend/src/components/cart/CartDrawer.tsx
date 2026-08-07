'use client';

import React from 'react';
import { ShoppingBag, X, Trash2, ArrowRight, Sparkles } from 'lucide-react';
import { useStore } from '../../store/useStore';

export const CartDrawer: React.FC = () => {
  const { isCartOpen, toggleCart, cart, removeFromCart, clearCart } = useStore();

  if (!isCartOpen) return null;

  const total = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md glass-panel h-full border-l border-white/10 flex flex-col justify-between p-6 shadow-2xl">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-lg text-white">Your Instacart Basket</h3>
          </div>
          <button
            onClick={toggleCart}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-20 text-slate-400 space-y-2">
              <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold">Your basket is empty</p>
              <p className="text-xs">Add AI recommendations to test basket co-occurrence models.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={item.product.image_url}
                    alt={item.product.title}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                  <div>
                    <h4 className="font-semibold text-xs text-white line-clamp-1">{item.product.title}</h4>
                    <p className="text-[11px] text-blue-400">Qty: {item.quantity} • ₹{item.product.price.toFixed(2)}</p>
                  </div>
                </div>

                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Bottom Checkout */}
        {cart.length > 0 && (
          <div className="border-t border-white/10 pt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Subtotal</span>
              <span className="font-extrabold text-white text-base">₹{total.toFixed(2)}</span>
            </div>
            
            <button
              onClick={() => {
                alert('Order simulated successfully! Telemetry events updated.');
                clearCart();
                toggleCart();
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-white font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
