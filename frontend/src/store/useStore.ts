import { create } from 'zustand';
import { Product } from '@/lib/api';

interface CartItem {
  product: Product;
  quantity: number;
}

interface AppState {
  sessionId: string;
  activeIntentLabel: string;
  intentConfidence: number;
  consentGiven: boolean;
  cart: CartItem[];
  isCartOpen: boolean;
  
  // Actions
  setSessionId: (id: string) => void;
  setActiveIntent: (label: string, confidence?: number) => void;
  toggleConsent: () => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  toggleCartOpen: () => void;
  clearCart: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  sessionId: typeof window !== 'undefined' 
    ? localStorage.getItem('intentiq_session_id') || `sess_${Math.random().toString(36).substring(2, 9)}`
    : 'sess_default_123',
  activeIntentLabel: 'Neutral (Awaiting Signals)',
  intentConfidence: 0.5,
  consentGiven: true,
  cart: [],
  isCartOpen: false,

  setSessionId: (id) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('intentiq_session_id', id);
    }
    set({ sessionId: id });
  },

  setActiveIntent: (label, confidence = 0.88) => set({ activeIntentLabel: label, intentConfidence: confidence }),

  toggleConsent: () => set((state) => ({ consentGiven: !state.consentGiven })),

  addToCart: (product) => set((state) => {
    const existing = state.cart.find((item) => item.product.id === product.id);
    if (existing) {
      return {
        cart: state.cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      };
    }
    return { cart: [...state.cart, { product, quantity: 1 }], isCartOpen: true };
  }),

  removeFromCart: (productId) => set((state) => ({
    cart: state.cart.filter((item) => item.product.id !== productId),
  })),

  toggleCartOpen: () => set((state) => ({ isCartOpen: !state.isCartOpen })),

  clearCart: () => set({ cart: [] }),
}));
