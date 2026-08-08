'use client';
import { X, ShoppingBasket, Trash2, Plus, Minus, CreditCard } from 'lucide-react';
import { useCart } from './CartContext';

export default function CartDrawer({ isOpen, onClose }) {
  const { cart, addToCart, removeFromCart, clearCart, totalItems, totalPrice } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end">
      {/* Background click to close */}
      <div className="absolute inset-0 z-0" onClick={onClose}></div>

      {/* Drawer Panel */}
      <div className="relative z-10 w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right border-l border-slate-100">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
              <ShoppingBasket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Your Basket</h3>
              <p className="text-slate-400 text-xs mt-0.5">{totalItems} items selected</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 p-1.5 rounded-full bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable list of items */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1 no-scrollbar">
          {totalItems === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center text-slate-400 gap-3">
              <ShoppingBasket className="w-12 h-12 text-slate-300" />
              <span className="text-sm font-semibold">Your basket is currently empty.</span>
            </div>
          ) : (
            Object.values(cart).map((item) => (
              <div key={item.product_id} className="flex items-center justify-between border-b border-slate-50 pb-3 mb-3 last:border-0 last:pb-0 last:mb-0">
                <div className="flex-1 pr-2">
                  <h5 className="text-xs font-bold text-slate-800 truncate max-w-[220px]">
                    {item.name || `Product #${item.product_id}`}
                  </h5>
                  <span className="text-[10px] text-slate-505 mt-0.5 block">₹{(item.price || 0).toFixed(2)} x {item.count}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
                    <button 
                      onClick={() => removeFromCart(item.product_id)}
                      className="px-2 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-2 text-xs font-bold text-slate-800">{item.count}</span>
                    <button 
                      onClick={() => addToCart(item)}
                      className="px-2 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-xs font-black text-slate-800 min-w-[60px] text-right">
                    ₹{((item.price || 0) * item.count).toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {totalItems > 0 && (
          <div className="p-5 border-t border-slate-100 bg-slate-50 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Subtotal:</span>
              <span className="text-lg font-black text-slate-800">₹{totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={clearCart}
                className="flex-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 py-3 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-1.5 shadow-sm animate-fade-in"
              >
                <Trash2 className="w-4 h-4" /> Clear
              </button>
              <button 
                onClick={() => {
                  alert('Order successfully submitted to IntentIQ engine.');
                  clearCart();
                  onClose();
                }}
                className="flex-2 flex-grow bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/15 animate-fade-in"
              >
                <CreditCard className="w-4 h-4" /> Checkout
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
