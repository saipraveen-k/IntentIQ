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
  ShoppingBag,
  Grid
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
  'Lemon',
  'Sony Headphones',
  'Nike Sneakers'
];

// Rich fallback dataset per category when backend is offline or loading
const MOCK_DATASET = {
  produce: [
    { product_id: 13176, name: "Bag of Organic Bananas", department: "produce", price: 9.15, rating: 4.9, reason: "🍌 Organic & Fresh Bestseller" },
    { product_id: 47209, name: "Organic Hass Avocado", department: "produce", price: 8.20, rating: 4.8, reason: "🥑 Healthy Choice Pick" },
    { product_id: 16797, name: "Fresh Strawberries", department: "produce", price: 3.45, rating: 4.9, reason: "🍓 Customer Favorite Fruit" },
    { product_id: 21137, name: "Organic Strawberries", department: "produce", price: 4.40, rating: 4.7, reason: "🍎 Handpicked For You" },
    { product_id: 5876, name: "Organic Lemon", department: "produce", price: 2.50, rating: 4.6, reason: "🍋 Fresh Citrus Zest" },
    { product_id: 21903, name: "Organic Baby Spinach", department: "produce", price: 12.95, rating: 4.8, reason: "🥬 Superfood Green Pick" },
    { product_id: 22935, name: "Organic Yellow Onion", department: "produce", price: 5.35, rating: 4.7, reason: "🧅 Kitchen Essential" },
    { product_id: 45007, name: "Organic Zucchini", department: "produce", price: 3.45, rating: 4.8, reason: "🥒 Fresh Harvest Produce" },
    { product_id: 46979, name: "Fresh Green Asparagus", department: "produce", price: 7.20, rating: 4.9, reason: "🥦 Garden Fresh Harvest" },
    { product_id: 26209, name: "Fresh Limes 2lb Bag", department: "produce", price: 2.10, rating: 4.6, reason: "🍋 Zesty Fresh Citrus" },
    { product_id: 24852, name: "Organic Fuji Apples", department: "produce", price: 6.50, rating: 4.9, reason: "🍎 Sweet Crispy Apples" },
    { product_id: 39275, name: "Organic Blueberries 6oz", department: "produce", price: 4.99, rating: 4.8, reason: "🫐 Antioxidant Superfood" }
  ],
  dairy: [
    { product_id: 27845, name: "Organic Whole Milk 1 Gal", department: "dairy eggs", price: 5.49, rating: 4.9, reason: "🥛 Farm Fresh Daily Essential" },
    { product_id: 7781, name: "Organic Mozzarella String Cheese", department: "dairy eggs", price: 9.15, rating: 4.8, reason: "🧀 High Protein Snack Pick" },
    { product_id: 8103, name: "Provolone Style Cheese Slices", department: "dairy eggs", price: 6.30, rating: 4.7, reason: "🔥 Popular Choice" },
    { product_id: 9840, name: "Organic Large Brown Eggs 12ct", department: "dairy eggs", price: 4.99, rating: 4.9, reason: "🥚 Pasture Raised Eggs" },
    { product_id: 11200, name: "Greek Style Plain Yogurt 32oz", department: "dairy eggs", price: 5.25, rating: 4.8, reason: "🥣 High Protein Yogurt" },
    { product_id: 12400, name: "Unsalted Organic Butter 1lb", department: "dairy eggs", price: 4.50, rating: 4.7, reason: "🧈 Pure Creamery Butter" },
    { product_id: 13500, name: "Sharp Cheddar Cheese Block", department: "dairy eggs", price: 6.99, rating: 4.9, reason: "🧀 Aged Rich Flavor" }
  ],
  beverages: [
    { product_id: 3001, name: "100% Pure Orange Juice 52oz", department: "beverages", price: 4.89, rating: 4.8, reason: "🍊 Fresh Squeezed Citrus" },
    { product_id: 3002, name: "Cold Brew Dark Roast Coffee 32oz", department: "beverages", price: 5.99, rating: 4.9, reason: "☕ Smooth Caffeine Boost" },
    { product_id: 3003, name: "Organic Green Tea 20 Bags", department: "beverages", price: 3.99, rating: 4.7, reason: "🍵 Antioxidant Rich Blend" },
    { product_id: 3004, name: "Sparkling Lime Water 12 Pack", department: "beverages", price: 6.49, rating: 4.8, reason: "🥤 Zero Sugar Refreshment" },
    { product_id: 3005, name: "Barista Oat Milk 32oz", department: "beverages", price: 4.29, rating: 4.9, reason: "🥛 Creamy Plant Milk" }
  ],
  snacks: [
    { product_id: 4001, name: "Organic Tortilla Chips 12oz", department: "snacks", price: 3.99, rating: 4.8, reason: "🌽 Crunchy Corn Chips" },
    { product_id: 4002, name: "Dark Chocolate Sea Salt Bar", department: "snacks", price: 2.99, rating: 4.9, reason: "🍫 Premium 70% Cacao" },
    { product_id: 4003, name: "Kettle Cooked Potato Chips", department: "snacks", price: 3.49, rating: 4.7, reason: "🥔 Crunchy Sea Salt" },
    { product_id: 4004, name: "Roasted Salted Almonds 16oz", department: "snacks", price: 8.99, rating: 4.9, reason: "🥜 Heart Healthy Snack" },
    { product_id: 4005, name: "Chocolate Chip Cookies 10oz", department: "snacks", price: 4.19, rating: 4.8, reason: "🍪 Fresh Baked Treat" }
  ],
  bakery: [
    { product_id: 5001, name: "Artisanal Sourdough Bread Loaf", department: "bakery", price: 5.49, rating: 4.9, reason: "🍞 Fresh Baked Sourdough" },
    { product_id: 5002, name: "All-Butter French Croissants 4ct", department: "bakery", price: 4.99, rating: 4.8, reason: "🥐 Flaky Butter Pastry" },
    { product_id: 5003, name: "100% Whole Wheat Bread", department: "bakery", price: 3.89, rating: 4.7, reason: "🍞 Fiber Rich Whole Grain" },
    { product_id: 5004, name: "Everything Bagels 6 Pack", department: "bakery", price: 4.29, rating: 4.8, reason: "🥯 New York Style Bagels" }
  ],
  meat: [
    { product_id: 6001, name: "Wild Caught Salmon Fillet 1lb", department: "meat seafood", price: 14.99, rating: 4.9, reason: "🐟 Fresh Omega-3 Rich" },
    { product_id: 6002, name: "Organic Boneless Chicken Breast", department: "meat seafood", price: 9.99, rating: 4.8, reason: "🍗 Lean Protein Cut" },
    { product_id: 6003, name: "Grass-Fed Ground Beef 85/15", department: "meat seafood", price: 8.49, rating: 4.9, reason: "🥩 100% Grass-Fed Beef" }
  ],
  electronics: [
    { product_id: 201, name: "Sony WH-1000XM5 Wireless Headphones", department: "electronics", price: 29990.00, rating: 4.8, reason: "🎧 Top Noise Canceling Headphones" },
    { product_id: 202, name: "Apple iPad Air M2 11-Inch Wi-Fi", department: "electronics", price: 59900.00, rating: 4.9, reason: "📱 Powerful M2 Retina Display" },
    { product_id: 203, name: "Dell UltraSharp 27 4K USB-C Monitor", department: "electronics", price: 42500.00, rating: 4.7, reason: "🖥️ Professional 4K Display" },
    { product_id: 204, name: "Logitech MX Master 3S Wireless Mouse", department: "electronics", price: 8995.00, rating: 4.9, reason: "🖱️ Ergonomic Precision Mouse" },
    { product_id: 205, name: "Samsung T7 Shield Portable SSD 2TB", department: "electronics", price: 16499.00, rating: 4.8, reason: "💾 Ultra-Fast Rugged SSD" },
    { product_id: 208, name: "Keychron Q1 Mechanical Keyboard", department: "electronics", price: 18500.00, rating: 4.9, reason: "⌨️ Custom Aluminum Keyboard" }
  ],
  fashion: [
    { product_id: 211, name: "Levi's 501 Original Fit Unisex Jeans", department: "fashion", price: 3999.00, rating: 4.6, reason: "👖 Classic Blue Denim" },
    { product_id: 212, name: "Nike Air Force 1 '07 Sneakers", department: "fashion", price: 7495.00, rating: 4.9, reason: "👟 Iconic White Sneakers" },
    { product_id: 213, name: "Adidas Essentials Fleece Hoodie", department: "fashion", price: 3299.00, rating: 4.7, reason: "🧥 Cozy Fleece Apparel" },
    { product_id: 215, name: "Ray-Ban Classic Wayfarer Sunglasses", department: "fashion", price: 8590.00, rating: 4.8, reason: "🕶️ Timeless Icon Style" },
    { product_id: 218, name: "Fossil Heritage Leather Watch", department: "fashion", price: 9495.00, rating: 4.7, reason: "⌚ Minimalist Analog Watch" }
  ],
  home: [
    { product_id: 101, name: "Nordic Minimalist Oak Wood Desk Lamp", department: "home", price: 2499.00, rating: 4.8, reason: "💡 Warm LED Accent Lighting" },
    { product_id: 102, name: "Ergonomic Mesh Home Office Chair", department: "home", price: 8999.00, rating: 4.7, reason: "🪑 Lumbar Support Chair" },
    { product_id: 103, name: "Ceramic Matte Black Coffee Mug Set", department: "home", price: 899.00, rating: 4.9, reason: "☕ Handcrafted Stoneware" },
    { product_id: 106, name: "Nordic Ceramic Ribbed Flower Vase", department: "home", price: 1299.00, rating: 4.9, reason: "🌾 Boho Living Room Decor" }
  ]
};

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
  const [activeTabTitle, setActiveTabTitle] = useState('Curated Store Catalog');
  const [activeCategory, setActiveCategory] = useState('all');
  
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const suggestionRef = useRef(null);

  // Load feed recommendations or catalog products
  const loadFeed = async (sessionHistory = []) => {
    if (!token) return;
    setLoading(true);
    setError(false);
    setFallback(false);
    setSearchQuery('');
    setActiveCategory('all');
    setActiveTabTitle('Curated Store Catalog');
    
    try {
      // Fetch products from catalog endpoint
      const response = await axios.get(`${API_URL}/api/v1/catalog/products?limit=48`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.products && response.data.products.length > 0) {
        setProducts(response.data.products);
      } else {
        // Fallback to feed endpoint
        const feedRes = await axios.post(`${API_URL}/api/v1/recommendations/feed`, {
          user_id: user?.uid || 'mock-user',
          session_history: sessionHistory
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProducts(feedRes.data.recommendations || feedRes.data.products || []);
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
    setActiveTabTitle(`Search Results for '${query}'`);
    setShowSuggestions(false);

    try {
      const response = await axios.post(`${API_URL}/api/v1/search/semantic`, {
        query: query,
        user_id: user?.uid || 'mock-user'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const results = response.data.results || [];
      if (results.length === 0 || response.data.fallback) {
        setFallback(true);
        setFallbackReason(`Showing relevant catalog items for '${query}'`);
      }
      
      setProducts(results.length > 0 ? results : getAllMockProducts());

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

  // Handle category selector click
  const handleCategorySelect = async (query, categoryName, department) => {
    if (!token) return;
    setActiveCategory(department);
    setLoading(true);
    setError(false);
    setFallback(false);
    
    if (department === 'all' || !query) {
      loadFeed();
      return;
    }

    setActiveTabTitle(`${categoryName}`);
    setSearchQuery(categoryName);

    try {
      const response = await axios.get(`${API_URL}/api/v1/catalog/category/${encodeURIComponent(query)}?limit=48`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const results = response.data.products || [];
      
      if (results.length > 0) {
        setProducts(results);
      } else {
        // Semantic search fallback
        const searchRes = await axios.post(`${API_URL}/api/v1/search/semantic`, {
          query: query,
          user_id: user?.uid || 'mock-user'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const searchItems = searchRes.data.results || [];
        setProducts(searchItems.length > 0 ? searchItems : getMockProductsForCategory(department));
      }
    } catch (err) {
      console.error(err);
      setProducts(getMockProductsForCategory(department));
    } finally {
      setLoading(false);
    }
  };

  const getMockProductsForCategory = (dept) => {
    const d = (dept || '').toLowerCase();
    for (const [key, items] of Object.entries(MOCK_DATASET)) {
      if (d.includes(key) || key.includes(d)) {
        return items;
      }
    }
    return getAllMockProducts();
  };

  const getAllMockProducts = () => {
    let all = [];
    Object.values(MOCK_DATASET).forEach(arr => {
      all = all.concat(arr);
    });
    return all;
  };

  // Select persona toggle
  const selectPersona = async (personaId) => {
    setLoading(true);
    setError(false);
    setFallback(false);
    setActivePersona(personaId);
    
    const personaLabel = PERSONAS.find(p => p.id === personaId)?.label || personaId;
    setActiveTabTitle(`${personaLabel} Picks`);

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
    setProducts(getAllMockProducts());
  };

  const loadMockSearch = (query) => {
    const q = query.toLowerCase();
    const all = getAllMockProducts();
    const filtered = all.filter(p => p.name.toLowerCase().includes(q) || p.department.toLowerCase().includes(q));
    setProducts(filtered.length > 0 ? filtered : all.slice(0, 12));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-slate-500">Loading storefront catalog...</span>
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
            <span>Browsing offline storefront catalog. Connect to backend for real-time recommendations.</span>
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
              Back to Full Catalog
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
            <Grid className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">{activeTabTitle}</h2>
            <span className="bg-indigo-100 text-indigo-800 text-[11px] font-black px-2.5 py-0.5 rounded-full">
              {products.length} Items Available
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-extrabold bg-slate-100/80 border border-slate-200/60 px-3 py-1 rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            Live Dataset Feed
          </div>
        </div>

        {/* Product Grid loading / lists */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
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
            <p className="text-xs text-slate-500 mt-1 max-w-sm">Try selecting another category pill or searching for items above.</p>
            <button onClick={() => loadFeed()} className="mt-4 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-xs text-indigo-700 px-5 py-2.5 rounded-2xl font-bold transition-all shadow-2xs">
              View Full Catalog
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
            <span className="text-slate-400">• Full Dataset Catalog Showcase</span>
          </div>
          <p className="font-semibold">© 2026 IntentIQ Market. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
