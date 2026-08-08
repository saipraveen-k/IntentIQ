'use client';
import { useState } from 'react';
import { Search, Camera, Sparkles } from 'lucide-react';

export default function SearchPanel({ onSearch, queryTags }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
          <Search className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-extrabold text-slate-800 text-sm">Multi-Modal Semantic Search</h4>
          <p className="text-slate-400 text-[10px] mt-0.5">Dual textual and mock image-vector representation similarity matching</p>
        </div>
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try searching 'organic sweet bananas' or click camera..."
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-10 pr-28 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
        />
        <div className="absolute right-2 top-2 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              alert('Multi-modal image feature: drop image file to align vectors.');
            }}
            className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
            title="Upload image query similarity"
          >
            <Camera className="w-4 h-4" />
          </button>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
          >
            Search
          </button>
        </div>
      </form>

      {/* Intent tags display */}
      {queryTags && queryTags.length > 0 && (
        <div className="space-y-1.5 animate-fade-in">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Query Intent Parsed Attributes</span>
          <div className="flex flex-wrap gap-1.5">
            {queryTags.map((tag, idx) => (
              <span
                key={idx}
                className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 animate-fade-in"
              >
                <Sparkles className="w-2.5 h-2.5" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
