'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { 
  Sparkles, 
  AlertTriangle, 
  Info, 
  TrendingUp, 
  Mail, 
  RefreshCw,
  Search,
  CheckCircle,
  ShoppingBag
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
import { getProductImage } from './utils/productImages';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const PERSONAS = [
  { id: 'healthy', label: '🍏 Healthy Lifestyle' },
  { id: 'student', label: '🎓 Quick & Easy' },
  { id: 'keto', label: '🥩 Keto & Protein' },
  { id: 'budget', label: '🪙 Daily Deals' },
  { id: 'family', label: '👨‍👩‍👧‍👦 Family Favorites' }
];

const MOCK_SUGGESTIONS = [
  'Bag of Organic Bananas',
  'Fresh Strawberries',
  'Organic Hass Avocado',
  'Organic Whole Milk',
  'Cheddar Cheese',
  'Organic Baby Spinach',
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
  const [fallback, setFallback] = useState(false);
  const [fallbackReason, setFallbackReason] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  
  const [activePersona, setActivePersona] = useState('healthy');
  const [activeTabTitle, setActiveTabTitle] = useState('Curated For You');
  
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
    setActiveTabTitle('Curated For You');
    
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
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error(err);
      setError(true);
      loadMockFeed();
    } fontally: {
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
        setFallbackReason(`Showing top popular selections for '${query}'`);
      }
      
      setProducts(results);

      // Log the search query and the results shown
      logEvent({
        eventType: 'search',
        queryText: query,
        resultsShown: results.map(p => String(p.product_id || p.id))
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
      { product_id: 13176, name: "Bag of Organic Bananas", department: "produce", price: 9.15, reason: "🍌 Organic & Fresh Bestseller" },
      { product_id: 47209, name: "Organic Hass Avocado", department: "produce", price: 8.20, reason: "🥑 Perfect for healthy breakfast" },
      { product_id: 16797, name: "Fresh Strawberries", department: "produce", price: 3.45, reason: "🍓 Customer Favorite Fruit" },
      { product_id: 27845, name: "Organic Whole Milk", department: "dairy eggs", price: 5.49, reason: "🥛 Farm Fresh Daily Essential" },
      { product_id: 7781, name: "Organic Mozzarella String Cheese", department: "dairy eggs", price: 9.15, reason: "🧀 High Protein Snack Pick" },
      { product_id: 8103, name: "Provolone Style Cheese Slices", department: "dairy eggs", price: 6.30, reason: "🔥 Popular Choice" },
      { product_id: 46979, name: "Fresh Asparagus", department: "produce", price: 7.20, reason: "🥦 Garden Harvest Pick" },
      { product_id: 26209, name: "Fresh Limes", department: "produce", price: 2.10, reason: "🍋 Fresh Citrus Zest" }
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
    setActiveTabTitle(`${categoryName} Essentials`);
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
      let filtered = results.filter(p => (p.department || p.category || '').toLowerCase().trim().includes(department.toLowerCase().trim()));
      
      // Fallback: If search doesn't return anything or filter is empty
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
        filtered = feedItems.filter(p => (p.department || p.category || '').toLowerCase().trim().includes(department.toLowerCase().trim()));
        
        if (filtered.length === 0) {
          filtered = getMockProductsForCategory(department);
        }
      }

      setProducts(filtered);
    } catch (err) {
      console.error(err);
      setProducts(getMockProductsForCategory(department));
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
    setActiveTabTitle(`${personaLabel} Selection`);

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
      { product_id: 13176, name: "Bag of Organic Bananas", department: "produce", price: 9.15, reason: "🍌 Organic & Fresh Bestseller" },
      { product_id: 47209, name: "Organic Hass Avocado", department: "produce", price: 8.20, reason: "🥑 Healthy Choice Pick" },
      { product_id: 16797, name: "Fresh Strawberries", department: "produce", price: 3.45, reason: "🍓 Customer Favorite Fruit" },
      { product_id: 21137, name: "Organic Strawberries", department: "produce", price: 4.40, reason: "🍎 Handpicked For You" },
      { product_id: 5876, name: "Organic Lemon", department: "produce", price: 2.50, reason: "🍋 Fresh Citrus Zest" },
      { product_id: 21903, name: "Organic Baby Spinach", department: "produce", price: 12.95, reason: "🥬 Superfood Green Pick" },
      { product_id: 22935, name: "Organic Yellow Onion", department: "produce", price: 5.35, reason: "🧅 Kitchen Essential" },
      { product_id: 45007, name: "Organic Zucchini", department: "produce", price: 3.45, reason: "🥒 Fresh Harvest Produce" }
    ]);
  };

  const loadMockSearch = (query) => {
    const q = query.toLowerCase();
    if (q.includes('fruit') || q.includes('banana') || q.includes('apple')) {
      setProducts([
        { product_id: 13176, name: "Bag of Organic Bananas", department: "produce", price: 9.15, reason: "🔥 Bestselling Organic Bananas" },
        { product_id: 16797, name: "Fresh Strawberries", department: "produce", price: 3.45, reason: "🍎 Sweet Fresh Strawberries" },
        { product_id: 21137, name: "Organic Strawberries", department: "produce", price: 4.40, reason: "⭐ Highly Rated Selection" }
      ]);
    } else {
      setFallback(true);
      setFallbackReason(`Showing popular storefront items for '${query}'`);
      setProducts([
        { product_id: 13176, name: "Bag of Organic Bananas", department: "produce", price: 9.15, reason: "🔥 Popular Choice" },
        { product_id: 47209, name: "Organic Hass Avocado", department: "produce", price: 8.20, reason: "⭐ Customer Favorite" },
        { product_id: 7781, name: "Organic Mozzarella String Cheese", department: "dairy eggs", price: 9.15, reason: "🧀 High Protein Snack" }
      ]);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-slate-500">Loading storefront...</span>
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
            <h1 className="text-base font-bold text-slate-800">Verify your email address</h1>
            <p className="text-xs text-slate-500 mt-2 max-w-sm leading-relaxed">
              We've sent a verification link to <span className="font-bold text-slate-800">{user.email}</span>. 
              Please verify your email address to access the store catalog.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 w-full">
            <button
              onClick={() => sendVerification()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-2xl transition-all shadow-lg shadow-indigo-600/15 active:scale-95 text-xs sm:text-sm flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Resend Verification Link</span>
            </button>
            <button
              onClick={() => logout()}
              className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold py-3 px-4 rounded-2xl transition-all active:scale-95 text-xs sm:text-sm"
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

      {/* Main Store Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        
        {/* Offline Fallback Banner */}
        {error && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-center gap-3 animate-fade-in text-xs sm:text-sm text-amber-800 font-bold shadow-2xs">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span>Viewing offline catalog items. Connect to backend for real-time recommendations.</span>
          </div>
        )}

        {/* Search Query Info Banner */}
        {fallback && (
          <div className="mb-6 p-4 bg-indigo-50/80 border border-indigo-100 rounded-2xl flex items-center justify-between gap-3 animate-fade-in text-xs sm:text-sm text-indigo-800 font-bold shadow-2xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>{fallbackReason}</span>
            </div>
            <button onClick={() => loadFeed()} className="text-xs text-indigo-600 hover:text-indigo-800 underline font-extrabold">
              Back to Feed
            </button>
          </div>
        )}

        {/* Dynamic Hero Banner */}
        <HeroBanner onExplore={() => selectPersona('healthy')} />

        {/* Shop By Style & Preference Pills */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3.5">
            <div className="w-1.5 h-4 bg-indigo-600 rounded-full"></div>
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">Shop By Diet & Preference</h4>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {PERSONAS.map(p => {
              const active = activePersona === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => selectPersona(p.id)}
                  className={`px-4.5 py-2.5 rounded-2xl text-xs font-bold border transition-all duration-200 shadow-2xs active:scale-95 ${
                    active 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-102' 
                      : 'bg-white border-slate-200/80 text-slate-700 hover:border-indigo-300 hover:bg-slate-50/80'
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

        {/* Trending Weekly Discoveries Carousel */}
        {!loading && products.length > 0 && (
          <TrendingCarousel items={products} onProductClick={(pid) => setSelectedProductId(pid)} />
        )}

        {/* Main Products Section Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6 mt-8">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">{activeTabTitle}</h2>
          </div>
          <div className="text-[11px] text-slate-500 font-extrabold bg-slate-100/80 border border-slate-200/60 px-3 py-1 rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            Express Local Catalog
          </div>
        </div>

        {/* Product Grid loading / lists */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-2xl p-3 animate-pulse flex flex-col gap-2.5 shadow-2xs">
                <div className="w-full aspect-square bg-slate-100 rounded-xl"></div>
                <div className="h-4 bg-slate-100 rounded-lg w-3/4 mt-1"></div>
                <div className="h-3 bg-slate-100 rounded-lg w-1/2"></div>
                <div className="flex justify-between items-center mt-3">
                  <div className="h-5 bg-slate-100 rounded-lg w-1/3"></div>
                  <div className="h-9 bg-slate-100 rounded-xl w-14"></div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center bg-white border border-slate-100 rounded-3xl shadow-sm">
            <Search className="w-12 h-12 text-slate-300 mb-3 stroke-1" />
            <h3 className="text-sm font-bold text-slate-800">No items match your search</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">Try searching for fruits, vegetables, dairy, coffee or snacks.</p>
            <button onClick={() => loadFeed()} className="mt-4 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-xs text-indigo-700 px-5 py-2.5 rounded-2xl font-bold transition-all shadow-2xs">
              Return to Catalog
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((item) => (
              <ProductCard 
                key={item.product_id || item.id} 
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
      <footer className="bg-white border-t border-slate-100 py-8 text-center text-xs text-slate-500 mt-16 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="font-extrabold text-slate-800">IntentIQ Storefront</span>
            <span className="text-slate-400">• Express Grocery & Lifestyle Marketplace</span>
          </div>
          <p className="font-semibold">© 2026 IntentIQ Market. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
