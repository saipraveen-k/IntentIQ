'use client';
import { 
  Apple, 
  Leaf, 
  Egg, 
  Cookie, 
  CupSoda, 
  Croissant, 
  Drumstick, 
  Snowflake, 
  Package, 
  Sparkles, 
  Headphones, 
  Shirt, 
  Home, 
  LayoutGrid 
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', name: 'All Products', query: '', department: 'all', icon: LayoutGrid, color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  { id: 'produce', name: 'Produce & Fruits', query: 'produce', department: 'produce', icon: Apple, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  { id: 'dairy', name: 'Dairy & Eggs', query: 'dairy', department: 'dairy eggs', icon: Egg, color: 'bg-sky-50 text-sky-600 border-sky-200' },
  { id: 'beverages', name: 'Beverages & Drinks', query: 'beverages', department: 'beverages', icon: CupSoda, color: 'bg-purple-50 text-purple-600 border-purple-200' },
  { id: 'snacks', name: 'Snacks & Chips', query: 'snacks', department: 'snacks', icon: Cookie, color: 'bg-amber-50 text-amber-600 border-amber-200' },
  { id: 'bakery', name: 'Bakery & Bread', query: 'bakery', department: 'bakery', icon: Croissant, color: 'bg-orange-50 text-orange-600 border-orange-200' },
  { id: 'meat', name: 'Meat & Seafood', query: 'meat', department: 'meat seafood', icon: Drumstick, color: 'bg-rose-50 text-rose-600 border-rose-200' },
  { id: 'frozen', name: 'Frozen Foods', query: 'frozen', department: 'frozen', icon: Snowflake, color: 'bg-cyan-50 text-cyan-600 border-cyan-200' },
  { id: 'pantry', name: 'Pantry Essentials', query: 'pantry', department: 'pantry', icon: Package, color: 'bg-teal-50 text-teal-600 border-teal-200' },
  { id: 'electronics', name: 'Electronics', query: 'electronics', department: 'electronics', icon: Headphones, color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { id: 'fashion', name: 'Fashion & Apparel', query: 'fashion', department: 'fashion', icon: Shirt, color: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200' },
  { id: 'home', name: 'Home & Living', query: 'home', department: 'home', icon: Home, color: 'bg-lime-50 text-lime-600 border-lime-200' }
];

export default function CategoryPills({ onCategorySelect, activeCategory }) {
  return (
    <section className="mb-10 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-black text-slate-900 text-base sm:text-lg tracking-tight">Explore By Category</h3>
          <p className="text-slate-500 text-xs mt-0.5 font-medium">Select a category to browse hundreds of items from our dataset</p>
        </div>
        {activeCategory && (
          <button 
            onClick={() => onCategorySelect('', 'All Products', 'all')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 transition-all"
          >
            Show All Items
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-3">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.department || (cat.id === 'all' && (!activeCategory || activeCategory === 'all'));
          return (
            <button
              key={cat.id}
              onClick={() => onCategorySelect(cat.query, cat.name, cat.department)}
              className="flex flex-col items-center gap-2 group focus:outline-none transition-transform active:scale-95"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-300 group-hover:scale-105 group-hover:shadow-md ${
                isActive 
                  ? 'ring-2 ring-indigo-600 scale-105 bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20' 
                  : cat.color
              }`}>
                <Icon className="w-6 h-6 transition-transform group-hover:scale-110" />
              </div>
              <span className={`text-[11px] font-bold text-center leading-tight transition-colors max-w-[80px] ${
                isActive ? 'text-indigo-600 font-black scale-102' : 'text-slate-600 group-hover:text-slate-900'
              }`}>
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
