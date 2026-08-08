'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { 
  Search, 
  ShoppingBag, 
  User, 
  Sparkles, 
  AlertTriangle, 
  Info, 
  MapPin, 
  ChevronRight, 
  Heart,
  TrendingUp,
  AlertCircle,
  Mail,
  RefreshCw
} from 'lucide-react';
import { useCart } from './components/CartContext';
import HeroBanner from './components/HeroBanner';
import TrendingCarousel from './components/TrendingCarousel';
import CategoryPills from './components/CategoryPills';
import ProductCard from './components/ProductCard';
import BundleModal from './components/BundleModal';
import CartDrawer from './components/CartDrawer';
import Header from './components/Header';
import { useAuth } from '../hooks/useAuth';
import { useEventLogger } from '../hooks/useEventLogger';


const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const PERSONAS = [
  { id: 'healthy', label: '🍏 Healthy' },
  { id: 'student', label: '🎓 Student' },
  { id: 'keto', label: '🥩 Keto' },
  { id: 'budget', label: '🪙 Budget' },
  { id: 'family', label: '👨‍👩‍👧‍👦 Family' }
];

const MOCK_SUGGESTIONS = [
  'Organic Bananas',
  'Fresh Strawberries',
  'Almond Milk',
  'Cheddar Cheese',
  'Organic Hass Avocado',
  'Spinach and Salad',
  'Tortilla Chips',
  'Lemon'
];

export default function Home() {
  const { user, token, loading: authLoading, logout, sendVerification } = useAuth();
  const { logEvent } = useEventLogger();
  const { totalItems, totalPrice } = useCart();
  
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(false);
  const [latency, setLatency] = useState(0);
  const [fallback, setFallback] = useState(false);
  const [fallbackReason, setFallbackReason] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  
  const [activePersona, setActivePersona] = useState('healthy');
  const [activeTabTitle, setActiveTabTitle] = useState('Personalized For You');
  
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const suggestionRef = useRef(null);

  // Load feed recommendations
  const loadFeed = async (sessionHistory = []) => {
    if (!token) return;
    setLoading(true);
    setError(false);
    setFallback(false);
    setSearchQuery('');
    setActiveCategory(null);
    
    try {
      const response = await axios.post(`${API_URL}/api/v1/recommendations/feed`, {
        user_id: user?.uid || 'mock-user',
        session_history: sessionHistory
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.data && response.data.recommendations) {
        setProducts(response.data.recommendations);
        setLatency(10);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error(err);
      setError(true);
      loadMockFeed();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadFeed();
    }
  }, [token]);

  useEffect(() => {
    // Close suggestions dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle typing suggestions
  const handleQueryChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim()) {
      const filtered = MOCK_SUGGESTIONS.filter(item => 
        item.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // Select a suggestion
  const handleSelectSuggestion = (suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    executeSearch(suggestion);
  };

  // Perform search
  const executeSearch = async (query) => {
    if (!token) return;
    setLoading(true);
    setError(false);
    setFallback(false);
    setActiveTabTitle(`Results for '${query}'`);
    setShowSuggestions(false);

    try {
      const response = await axios.post(`${API_URL}/api/v1/search/semantic`, {
        query: query,
        user_id: user?.uid || 'mock-user'
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const results = response.data.results || [];
      if (response.data.fallback) {
        setFallback(true);
        setFallbackReason(response.data.fallback_reason || `Showing popular items in relevant aisles for '${query}'`);
      }
      
      setProducts(results);
      setLatency(response.data.latency_ms || 25);

      // Log the search query and the results shown
      logEvent({
        eventType: 'search',
        queryText: query,
        resultsShown: results.map(p => String(p.product_id))
      });

    } catch (err) {
      console.error(err);
      setError(true);
      loadMockSearch(query);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      executeSearch(searchQuery);
    }
  };

  const getMockProductsForCategory = (department) => {
    const allMocks = [
      { product_id: 13176, name: "Bag of Organic Bananas", department: "produce", price: 9.15, reason: "🍌 High match for organic shoppers" },
      { product_id: 47209, name: "Organic Hass Avocado", department: "produce", price: 8.20, reason: "🥑 Best pairing with breakfast" },
      { product_id: 16797, name: "Fresh Strawberries", department: "produce", price: 3.45, reason: "🍓 Best seller in fruits" },
      { product_id: 27845, name: "Organic Whole Milk", department: "dairy eggs", price: 5.49, reason: "🥛 Calcium rich essential" },
      { product_id: 7781, name: "Organic Mozzarella String Cheese Alternative", department: "dairy eggs", price: 9.15, reason: "🧀 Low-carb snack choice" },
      { product_id: 8103, name: "Dairy Free Slices Provolone Style Cheese Alternative", department: "dairy eggs", price: 6.30, reason: "🔥 High match for your preferences" },
      { product_id: 46979, name: "Asparagus", department: "produce", price: 7.20, reason: "🥦 Fresh vegetable harvest" },
      { product_id: 26209, name: "Limes", department: "produce", price: 2.10, reason: "🍋 Fresh citrus acid zest" }
    ];
    return allMocks.filter(p => (p.department || '').toLowerCase().trim() === department.toLowerCase().trim());
  };

  // Handle category selector click
  const handleCategorySelect = async (query, categoryName, department) => {
    if (!token) return;
    setActiveCategory(query);
    setLoading(true);
    setError(false);
    setFallback(false);
    setActiveTabTitle(`Discovering in ${categoryName}`);
    setSearchQuery(categoryName);

    try {
      const response = await axios.post(`${API_URL}/api/v1/search/semantic`, {
        query: query,
        user_id: user?.uid || 'mock-user'
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const results = response.data.results || [];
      
      // Filter by department on frontend
      let filtered = results.filter(p => (p.department || '').toLowerCase().trim() === department.toLowerCase().trim());
      
      // Fallback: If search doesn't return anything or filter is empty, fallback to the full recommendations list filtered by that department!
      if (filtered.length === 0) {
        const feedRes = await axios.post(`${API_URL}/api/v1/recommendations/feed`, {
          user_id: user?.uid || 'mock-user',
          session_history: []
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const feedItems = feedRes.data.recommendations || [];
        filtered = feedItems.filter(p => (p.department || '').toLowerCase().trim() === department.toLowerCase().trim());
        
        // If still empty, mock a few products for this category
        if (filtered.length === 0) {
          filtered = getMockProductsForCategory(department);
        }
      }

      setProducts(filtered);
      setLatency(response.data.latency_ms || 10);
    } catch (err) {
      console.error(err);
      setProducts(getMockProductsForCategory(department));
      setLatency(0);
    } finally {
      setLoading(false);
    }
  };

  // Select persona toggle
  const selectPersona = async (personaId) => {
    setLoading(true);
    setError(false);
    setFallback(false);
    setActivePersona(personaId);
    
    const personaLabel = PERSONAS.find(p => p.id === personaId)?.label || personaId;
    setActiveTabTitle(`${personaLabel.slice(2)} Recommendations`);

    try {
      const res = await axios.get(`${API_URL}/api/v1/persona/${personaId}`);
      const history = res.data || [];
      loadFeed(history);
    } catch (err) {
      console.error(err);
      setError(true);
      loadMockFeed();
      setLoading(false);
    }
  };

  // Mock data fallbacks
  const loadMockFeed = () => {
    setProducts([
      { product_id: 13176, name: "Bag of Organic Bananas", department: "produce", price: 9.15, reason: "🔥 Trending choice in produce" },
      { product_id: 47209, name: "Organic Hass Avocado", department: "produce", price: 8.20, reason: "⭐ Highly rated choice" },
      { product_id: 16797, name: "Fresh Strawberries", department: "produce", price: 3.45, reason: "⚡ Lightning Delivery pick" },
      { product_id: 21137, name: "Organic Strawberries", department: "produce", price: 4.40, reason: "🍎 Match for your profile" },
      { product_id: 5876, name: "Organic Lemon", department: "produce", price: 2.50, reason: "🔥 Trending choice in produce" },
      { product_id: 21903, name: "Organic Baby Spinach", department: "produce", price: 12.95, reason: "🔥 Popular in produce" },
      { product_id: 22935, name: "Organic Yellow Onion", department: "produce", price: 5.35, reason: "⭐ Highly rated choice" },
      { product_id: 45007, name: "Organic Zucchini", department: "produce", price: 3.45, reason: "🍎 Match for your profile" }
    ]);
    setLatency(0);
  };

  const loadMockSearch = (query) => {
    const q = query.toLowerCase();
    if (q.includes('fruit') || q.includes('banana') || q.includes('apple')) {
      setProducts([
        { product_id: 13176, name: "Bag of Organic Bananas", department: "produce", price: 9.15, reason: "🔥 Popular in produce" },
        { product_id: 16797, name: "Fresh Strawberries", department: "produce", price: 3.45, reason: "🍎 Match for your profile" },
        { product_id: 21137, name: "Organic Strawberries", department: "produce", price: 4.40, reason: "⭐ Highly rated choice" }
      ]);
    } else {
      setFallback(true);
      setFallbackReason(`Showing popular fallback items in Produce and Dairy for '${query}'`);
      setProducts([
        { product_id: 13176, name: "Bag of Organic Bananas", department: "produce", price: 9.15, reason: "🔥 Popular in produce" },
        { product_id: 47209, name: "Organic Hass Avocado", department: "produce", price: 8.20, reason: "⭐ Highly rated choice" },
        { product_id: 7781, name: "Organic Mozzarella String Cheese Alternative", department: "dairy eggs", price: 9.15, reason: "🔥 Popular in dairy" }
      ]);
    }
    setLatency(0);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-slate-500">Checking authentication...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!user.emailVerified) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-8 flex flex-col items-center text-center gap-6">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center border border-amber-100 shadow-sm shadow-amber-500/10">
            <Mail className="w-8 h-8 text-amber-500" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-700">Verify your email address</h1>
            <p className="text-xs text-slate-450 mt-2 max-w-sm leading-relaxed">
              We've sent a verification link to <span className="font-bold text-slate-750">{user.email}</span>. 
              Please verify your email address to access the recommendation feed.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 w-full">
            <button
              onClick={() => sendVerification()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-95 text-xs sm:text-sm flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Resend Verification Email</span>
            </button>
            <button
              onClick={() => logout()}
              className="w-full bg-slate-50 hover:bg-slate-100 text-slate-650 border border-slate-200 font-bold py-3 px-4 rounded-xl transition-all active:scale-95 text-xs sm:text-sm"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header
        searchQuery={searchQuery}
        onQueryChange={handleQueryChange}
        onSearchSubmit={handleSearchSubmit}
        suggestions={suggestions}
        showSuggestions={showSuggestions}
        onSelectSuggestion={handleSelectSuggestion}
        onCartClick={() => setIsCartOpen(true)}
        onLogoClick={() => loadFeed()}
      />

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        
        {/* Connection Failure Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 animate-fade-in text-xs sm:text-sm text-rose-600 font-semibold shadow-sm">
            <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0" />
            <span>IntentIQ personalization service is currently offline. Viewing default mock suggestions catalog.</span>
          </div>
        )}

        {/* Fallback Intent Query Banner */}
        {fallback && (
          <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between gap-3 animate-fade-in text-xs sm:text-sm text-indigo-700 font-semibold shadow-sm">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-500" />
              <span>{fallbackReason}</span>
            </div>
            <button onClick={() => loadFeed()} className="text-xs text-indigo-600 hover:text-indigo-700 underline font-bold">Clear Search</button>
          </div>
        )}

        {/* Dynamic Hero Banner */}
        <HeroBanner onExplore={() => selectPersona('healthy')} />

        {/* Persona Selector Chips */}
        <section className="mb-8">
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-1.5 h-4 bg-indigo-600 rounded"></div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Shopper Preference profile</h4>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {PERSONAS.map(p => {
              const active = activePersona === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => selectPersona(p.id)}
                  className={`px-4.5 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 shadow-sm ${
                    active 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-600/10' 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Category Grid Showcase */}
        <CategoryPills onCategorySelect={handleCategorySelect} activeCategory={activeCategory} />

        {/* Trending discoveries carousel */}
        {!loading && products.length > 0 && (
          <TrendingCarousel items={products} onProductClick={(pid) => setSelectedProductId(pid)} />
        )}

        {/* Main Grid section */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-6 mt-8">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-extrabold text-slate-800 tracking-tight">{activeTabTitle}</h2>
          </div>
          <div className="text-[11px] text-slate-400 font-bold">
            {latency > 0 ? `Latency: ${latency}ms` : 'Offline Mode (Mock Data)'}
          </div>
        </div>

        {/* Product Grid loading / lists */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-2xl p-3 animate-pulse flex flex-col gap-2">
                <div className="w-full aspect-square bg-slate-100 rounded-xl"></div>
                <div className="h-4 bg-slate-100 rounded w-3/4 mt-1"></div>
                <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                <div className="flex justify-between items-center mt-3">
                  <div className="h-5 bg-slate-100 rounded w-1/3"></div>
                  <div className="h-8 bg-slate-100 rounded w-12 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center bg-white border border-slate-100 rounded-3xl shadow-sm">
            <Search className="w-12 h-12 text-slate-300 mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No products found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">No direct recommendations or fallbacks match. Try another search query.</p>
            <button onClick={() => loadFeed()} className="mt-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 px-4 py-2 rounded-full font-bold transition-all">
              Return to default catalog
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((item) => (
              <ProductCard 
                key={item.product_id} 
                item={item} 
                onProductClick={(pid) => setSelectedProductId(pid)} 
              />
            ))}
          </div>
        )}

      </main>

      {/* Cart right sidebar drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Bundle Modal */}
      {selectedProductId && (
        <BundleModal 
          productId={selectedProductId} 
          apiUrl={API_URL} 
          onClose={() => setSelectedProductId(null)} 
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 mt-12 shadow-inner">
        <p className="font-semibold">© 2026 IntentIQ AI Storefront.</p>
      </footer>
    </>
  );
}
