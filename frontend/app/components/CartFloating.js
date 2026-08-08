'use client';
import { useState } from 'react';
import { useCart } from './CartContext';

export default function CartFloating() {
  const { cart, addToCart, removeFromCart, clearCart, totalItems, totalPrice } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  if (totalItems === 0) return null;

  return (
    <>
      {/* Floating Bottom Cart Widget */}
      <div className="fixed bottom-6 right-6 z-40 animate-fade-in">
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-instamart-orange to-rose-500 hover:from-instamart-orange hover:to-rose-600 text-white font-bold px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-3 border border-white/10"
        >
          <i className="fa-solid fa-basket-shopping"></i>
          <span>Cart Items ({totalItems})</span>
          <span className="text-white/80 border-l border-white/20 pl-3">₹{totalPrice.toFixed(2)}</span>
        </button>
      </div>

      {/* Cart Summary Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-instamart-card border border-instamart-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-instamart-border flex justify-between items-center bg-slate-900/50">
              <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                <i className="fa-solid fa-basket-shopping text-instamart-orange"></i> Your Cart Items
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full bg-slate-800 transition-colors"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            {/* Items List */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1 no-scrollbar">
              {Object.values(cart).map((item) => (
                <div key={item.product_id} className="flex items-center justify-between border-b border-instamart-border/50 pb-2 mb-2 last:border-0">
                  <div className="flex-1 pr-2">
                    <h5 className="text-xs font-bold text-white truncate max-w-[200px]">
                      {item.name || `Product #${item.product_id}`}
                    </h5>
                    <span className="text-[10px] text-slate-400">₹{(item.price || 0).toFixed(2)} x {item.count}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-slate-900 border border-instamart-border rounded-lg overflow-hidden">
                      <button 
                        onClick={() => removeFromCart(item.product_id)}
                        className="px-2.5 py-1 text-slate-400 hover:text-white text-xs hover:bg-slate-800"
                      >
                        -
                      </button>
                      <span className="px-2 text-xs font-bold text-white">{item.count}</span>
                      <button 
                        onClick={() => addToCart(item)}
                        className="px-2.5 py-1 text-slate-400 hover:text-white text-xs hover:bg-slate-800"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-xs font-bold text-white min-w-[50px] text-right">
                      ₹{((item.price || 0) * item.count).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-instamart-border bg-slate-900/80 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-bold">Total Bill:</span>
                <span className="text-lg font-black text-white">₹{totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { clearCart(); setIsOpen(false); }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl font-bold transition-all text-sm animate-fade-in"
                >
                  Clear Cart
                </button>
                <button 
                  onClick={() => {
                    alert('Order placed successfully! Instamart delivery is on its way.');
                    clearCart();
                    setIsOpen(false);
                  }}
                  className="flex-2 flex-grow bg-instamart-orange hover:bg-instamart-orange/90 text-white py-2.5 rounded-xl font-bold transition-all text-sm animate-fade-in"
                >
                  Proceed to Pay
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
