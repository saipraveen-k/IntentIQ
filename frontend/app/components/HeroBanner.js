'use client';
import { Sparkles, ArrowRight, ShieldCheck, Zap, Tag } from 'lucide-react';

export default function HeroBanner({ onExplore }) {
  return (
    <section className="relative rounded-3xl overflow-hidden mb-8 shadow-md border border-slate-100/80 bg-white">
      {/* Background gradients & floating ambient blobs */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/80 via-purple-50/40 to-white z-0"></div>
      <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-300/15 rounded-full blur-3xl -mr-20 -mt-20 animate-pulse"></div>
      <div className="absolute left-1/3 bottom-0 w-96 h-96 bg-purple-200/15 rounded-full blur-3xl -ml-20 -mb-20"></div>

      <div className="relative z-10 px-6 py-10 md:py-14 md:px-12 flex flex-col lg:flex-row items-center justify-between gap-8">
        
        {/* Left Column: Hero Content */}
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-indigo-100/80 border border-indigo-200/80 rounded-full px-3.5 py-1 text-xs text-indigo-700 font-extrabold mb-4 shadow-2xs animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
            <span>Smart Personal Assistant Active</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-slate-900 mb-4 animate-fade-in">
            Fresh groceries & essentials <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500 bg-clip-text text-transparent">
              curated for your lifestyle.
            </span>
          </h1>

          <p className="text-sm text-slate-600 max-w-lg mb-6 leading-relaxed font-medium">
            Explore fresh organic produce, daily essentials, and exclusive smart bundle savings. Choose your shopping vibe below for tailored picks!
          </p>

          <div className="flex flex-wrap items-center gap-3.5">
            <button 
              onClick={onExplore}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs sm:text-sm px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 hover:-translate-y-0.5 active:scale-95 flex items-center gap-2"
            >
              Shop Fresh Deals <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: User-Friendly Shopper Highlights */}
        <div className="grid sm:grid-cols-3 lg:grid-cols-1 gap-3.5 w-full lg:w-72">
          
          <div className="bg-white/90 backdrop-blur-md border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all border-l-4 border-l-indigo-600 flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5 fill-indigo-100" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-800 block">Express Delivery</span>
              <span className="text-[11px] text-slate-500 font-medium block">Fresh from local market</span>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all border-l-4 border-l-emerald-500 flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-800 block">100% Quality Assured</span>
              <span className="text-[11px] text-slate-500 font-medium block">Handpicked fresh items</span>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all border-l-4 border-l-amber-500 flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-800 block">Smart Bundle Savings</span>
              <span className="text-[11px] text-slate-500 font-medium block">Save up to 25% on combos</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
