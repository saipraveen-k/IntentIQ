import { create } from 'zustand';
import { Product, api } from '../lib/api';

interface CartItem {
  product: Product;
  quantity: number;
}

interface AppState {
  sessionId: string;
  activeIntentLabel: string;
  activePersona: string;
  intentConfidence: number;
  intentHistory: Array<{ timestamp: string; event_type: string; intent_label: string; confidence: number }>;
  cart: CartItem[];
  isCartOpen: boolean;
  isPrivacyModalOpen: boolean;
  isSearchModalOpen: boolean;
  
  // Actions
  setSessionId: (id: string) => void;
  setActivePersona: (persona: string) => void;
  setActiveIntent: (label: string, confidence: number, history?: any[]) => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  toggleCart: () => void;
  togglePrivacyModal: () => void;
  toggleSearchModal: () => void;
  recordEvent: (eventType: string, productId?: string, dwellMs?: number, queryText?: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  sessionId: 'sess_instacart_demo_101',
  activeIntentLabel: 'Fresh Produce & Pantry',
  activePersona: 'healthy',
  intentConfidence: 0.94,
  intentHistory: [
    { timestamp: new Date().toISOString(), event_type: 'SEARCH', intent_label: 'Fresh Produce', confidence: 0.88 },
    { timestamp: new Date().toISOString(), event_type: 'CLICK', intent_label: 'Organic Fruit', confidence: 0.94 }
  ],
  cart: [],
  isCartOpen: false,
  isPrivacyModalOpen: false,
  isSearchModalOpen: false,

  setSessionId: (id) => set({ sessionId: id }),
  setActivePersona: (persona) => set({ activePersona: persona }),
  setActiveIntent: (label, confidence, history) => set((state) => ({
    activeIntentLabel: label,
    intentConfidence: confidence,
    intentHistory: history || state.intentHistory
  })),

  addToCart: (product) => {
    set((state) => {
      const existing = state.cart.find((item) => item.product.id === product.id);
      if (existing) {
        return {
          cart: state.cart.map((item) =>
            item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          ),
        };
      }
      return { cart: [...state.cart, { product, quantity: 1 }] };
    });

    // Fire telemetry event
    get().recordEvent('ADD_TO_CART', product.id);
  },

  removeFromCart: (productId) =>
    set((state) => ({
      cart: state.cart.filter((item) => item.product.id !== productId),
    })),

  clearCart: () => set({ cart: [] }),
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
  togglePrivacyModal: () => set((state) => ({ isPrivacyModalOpen: !state.isPrivacyModalOpen })),
  toggleSearchModal: () => set((state) => ({ isSearchModalOpen: !state.isSearchModalOpen })),

  recordEvent: async (eventType, productId, dwellMs, queryText) => {
    const { sessionId } = get();
    try {
      await api.sendTelemetry(sessionId, eventType, productId, dwellMs, queryText);
    } catch (e) {
      console.warn('Telemetry event warning:', e);
    }
  },
}));
