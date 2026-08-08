'use client';
import { Apple, Leaf, Egg, Cookie, CupSoda, Croissant, Drumstick } from 'lucide-react';

const CATEGORIES = [
  { name: 'Fruits', query: 'fruit', department: 'produce', icon: Apple, color: 'bg-emerald-50 text-emerald-500 border-emerald-100' },
  { name: 'Vegetables', query: 'fresh', department: 'produce', icon: Leaf, color: 'bg-green-50 text-green-500 border-green-100' },
  { name: 'Dairy & Eggs', query: 'dairy eggs', department: 'dairy eggs', icon: Egg, color: 'bg-sky-50 text-sky-500 border-sky-100' },
  { name: 'Snacks', query: 'snacks', department: 'snacks', icon: Cookie, color: 'bg-amber-50 text-amber-500 border-amber-100' },
  { name: 'Beverages', query: 'beverages', department: 'beverages', icon: CupSoda, color: 'bg-purple-50 text-purple-500 border-purple-100' },
  { name: 'Bakery', query: 'bakery', department: 'bakery', icon: Croissant, color: 'bg-orange-50 text-orange-500 border-orange-100' },
  { name: 'Meat & Seafood', query: 'meat seafood', department: 'meat seafood', icon: Drumstick, color: 'bg-rose-50 text-rose-500 border-rose-100' }
];

export default function CategoryPills({ onCategorySelect, activeCategory }) {
  return (
    <section className="mb-8 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
      <h3 className="font-extrabold text-slate-800 text-sm mb-4">Shop By Category</h3>
      <div className="grid grid-cols-4 md:grid-cols-7 gap-4">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.query;
          return (
            <button
              key={cat.name}
              onClick={() => onCategorySelect(cat.query, cat.name, cat.department)}
              className="flex flex-col items-center gap-2 group focus:outline-none"
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all duration-200 group-hover:scale-105 group-hover:shadow-md ${
                isActive 
                  ? 'ring-2 ring-indigo-500 scale-105 bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm' 
                  : cat.color
              }`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className={`text-[11px] font-bold text-center leading-tight ${
                isActive ? 'text-indigo-600 font-extrabold' : 'text-slate-600 group-hover:text-slate-800'
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
