'use client';
import { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState({});

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev[product.product_id];
      const price = typeof product.price === 'number' ? product.price : 0;
      const name = product.name || `Product #${product.product_id}`;
      return {
        ...prev,
        [product.product_id]: {
          ...product,
          name,
          price,
          count: existing ? existing.count + 1 : 1,
        },
      };
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => {
      const existing = prev[productId];
      if (!existing) return prev;
      if (existing.count <= 1) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return {
        ...prev,
        [productId]: {
          ...existing,
          count: existing.count - 1,
        },
      };
    });
  };

  const clearCart = () => setCart({});

  const totalItems = Object.values(cart).reduce((sum, item) => sum + item.count, 0);
  const totalPrice = Object.values(cart).reduce((sum, item) => sum + item.price * item.count, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
