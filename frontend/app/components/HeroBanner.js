'use client';
import { Sparkles, ArrowRight, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function HeroBanner({ onExplore }) {
  return (
    <section className="relative rounded-3xl overflow-hidden mb-8 shadow-sm border border-slate-100 bg-white">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/70 via-sky-50/50 to-white z-0"></div>
      <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-200/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
      <div className="absolute left-1/3 bottom-0 w-96 h-96 bg-sky-200/10 rounded-full blur-3xl -ml-20 -mb-20"></div>

      <div className="relative z-10 px-6 py-10 md:py-14 md:px-12 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1 text-xs text-indigo-600 font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            Neural Personalization Engine Active
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-slate-900 mb-4">
            Discover what you <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">actually want.</span>
          </h1>
          <p className="text-sm text-slate-600 max-w-lg mb-6 leading-relaxed">
            IntentIQ infers your shopper micro-intent dynamically. Select a shopping profile tab below to adjust the model recommendations instantly.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={onExplore}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-md shadow-indigo-600/15 flex items-center gap-2"
            >
              Start Exploring <ArrowRight className="w-4 h-4" />
            </button>
            <Link 
              href="/agents"
              className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm px-6 py-3 rounded-xl transition-all border border-slate-200 flex items-center gap-2 shadow-sm"
            >
              <BookOpen className="w-4 h-4 text-slate-500" /> How It Works
            </Link>
            <Link 
              href="/dashboard"
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-sm px-6 py-3 rounded-xl transition-all border border-indigo-100 flex items-center gap-2 shadow-sm"
            >
              Jury Dashboard
            </Link>
          </div>
        </div>

        {/* Info widgets showcasing stats */}
        <div className="flex flex-wrap md:flex-col gap-4 w-full md:w-auto">
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm min-w-[200px] border-b-2 border-indigo-500">
            <span className="text-xs font-semibold text-slate-400 block">FAISS Retrieval SLA</span>
            <span className="text-lg font-extrabold text-slate-800 block mt-0.5">IVF-PQ Index</span>
            <span className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              Cosine Similarity Search
            </span>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm min-w-[200px] border-b-2 border-sky-500">
            <span className="text-xs font-semibold text-slate-400 block">Personalization Head</span>
            <span className="text-lg font-extrabold text-slate-800 block mt-0.5">Multi-Task NCF</span>
            <span className="text-[10px] text-indigo-600 font-bold mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
              Parallel SLA Timeout Guard
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
