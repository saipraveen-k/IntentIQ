"use client";

import React from 'react';
import { X, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { useAppStore } from '@/store/useStore';

export const CartDrawer: React.FC = () => {
  const isCartOpen = useAppStore((state) => state.isCartOpen);
  const toggleCartOpen = useAppStore((state) => state.toggleCartOpen);
  const cart = useAppStore((state) => state.cart);
  const removeFromCart = useAppStore((state) => state.removeFromCart);
  const clearCart = useAppStore((state) => state.clearCart);

  if (!isCartOpen) return null;

  const totalAmount = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-gray-900 border-l border-gray-800 h-full flex flex-col justify-between p-6 shadow-2xl">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-indigo-400" />
              <h2 className="font-bold text-lg text-gray-100">Your Cart</h2>
            </div>
            <button
              onClick={toggleCartOpen}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items */}
          {cart.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">
              Your shopping bag is empty. Click on items in the feed to test personalized intent bundling!
            </div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {cart.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="glass-panel p-3 rounded-xl flex items-center justify-between gap-3"
                >
                  <img
                    src={product.image_url}
                    alt={product.title}
                    className="w-12 h-12 rounded-lg object-cover bg-gray-800"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-gray-200 line-clamp-1">{product.title}</h4>
                    <p className="text-xs text-indigo-400 font-bold mt-0.5">
                      ₹{product.price.toLocaleString()} x {quantity}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(product.id)}
                    className="p-1 text-gray-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer / Checkout */}
        {cart.length > 0 && (
          <div className="border-t border-gray-800 pt-4 space-y-3">
            <div className="flex justify-between items-center text-sm font-semibold text-gray-200">
              <span>Total Amount:</span>
              <span className="text-lg text-indigo-400">₹{totalAmount.toLocaleString()}</span>
            </div>

            <button
              onClick={() => {
                alert('IntentIQ Purchase Complete! Intent Agent updated user affinity profile.');
                clearCart();
                toggleCartOpen();
              }}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all"
            >
              Checkout Now
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
