'use client';

import React from 'react';
import { ShoppingBag, X, Trash2, ArrowRight, Sparkles } from 'lucide-react';
import { useStore } from '../../store/useStore';

export const CartDrawer: React.FC = () => {
  const { isCartOpen, toggleCart, cart, removeFromCart, clearCart } = useStore();

  if (!isCartOpen) return null;

  const total = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white h-full border-l border-gray-200 flex flex-col justify-between p-6 shadow-2xl">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-gray-700" />
            <h3 className="font-semibold text-lg text-gray-900">Your cart</h3>
          </div>
          <button
            onClick={toggleCart}
            className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-20 text-gray-500 space-y-3">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-sm font-medium text-gray-900">Your cart is empty</p>
              <p className="text-sm">Add items to get started</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={item.product.image_url}
                    alt={item.product.title}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                  <div>
                    <h4 className="font-medium text-sm text-gray-900 line-clamp-1">{item.product.title}</h4>
                    <p className="text-xs text-gray-500">Qty: {item.quantity} • ₹{item.product.price.toFixed(2)}</p>
                  </div>
                </div>

                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Bottom Checkout */}
        {cart.length > 0 && (
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-bold text-gray-900 text-base">₹{total.toFixed(2)}</span>
            </div>
            
            <button
              onClick={() => {
                alert('Order simulated successfully!');
                clearCart();
                toggleCart();
              }}
              className="w-full py-3.5 rounded-xl bg-black hover:bg-gray-800 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all"
            >
              <span>Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
