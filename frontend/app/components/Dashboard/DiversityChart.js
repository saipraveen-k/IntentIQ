'use client';
import { BarChart3, AlertCircle } from 'lucide-react';

export default function DiversityChart({ products }) {
  // Calculate distribution
  const counts = {};
  let total = 0;
  
  if (products && products.length > 0) {
    products.forEach((p) => {
      const cat = p.department || 'grocery';
      counts[cat] = (counts[cat] || 0) + 1;
      total += 1;
    });
  } else {
    // Default mock data when no products
    counts['produce'] = 3;
    counts['dairy eggs'] = 2;
    counts['beverages'] = 1;
    counts['bakery'] = 1;
    total = 7;
  }

  const distribution = Object.keys(counts).map((cat) => {
    const count = counts[cat];
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return { name: cat, count, pct };
  }).sort((a, b) => b.pct - a.pct);

  const maxPct = distribution.length > 0 ? distribution[0].pct : 0;
  const isCompliant = maxPct <= 35;

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4 animate-fade-in">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm">Category Diversity Distribution</h4>
            <p className="text-slate-400 text-[10px] mt-0.5">Real-time slate balance check (35% hard ceiling)</p>
          </div>
        </div>

        {/* Status indicator */}
        <div className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
          isCompliant 
            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
            : 'bg-rose-50 text-rose-600 border border-rose-100'
        }`}>
          {isCompliant ? 'Diversity Compliant' : 'Ceiling Exceeded'}
        </div>
      </div>

      {/* Chart Bars */}
      <div className="space-y-3 relative pt-2">
        
        {/* 35% hard ceiling threshold line indicator */}
        <div className="absolute top-0 bottom-0 left-[35%] w-px border-l border-dashed border-rose-400 z-10 flex flex-col justify-between">
          <span className="text-[7px] text-rose-500 font-extrabold bg-white px-1 border border-rose-200 rounded self-start -ml-3 z-20">
            35% Max Cap
          </span>
          <span className="text-[7px] text-rose-500 font-extrabold bg-white px-1 border border-rose-200 rounded self-end -ml-3 z-20">
            Limit
          </span>
        </div>

        {distribution.map((item) => {
          const isOverLimit = item.pct > 35;
          return (
            <div key={item.name} className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="capitalize text-slate-600">{item.name}</span>
                <span className={isOverLimit ? 'text-rose-500' : 'text-slate-700'}>
                  {item.pct}% ({item.count} items)
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    isOverLimit ? 'bg-rose-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${item.pct}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* SLA Note */}
      <div className="text-[10px] text-slate-400 bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-start gap-1.5 leading-snug">
        <AlertCircle className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
        <span>DDPP compliance guardrails restrict any single aisle category from occupying &gt;35% of the recommendation slate to promote product diversity.</span>
      </div>
    </div>
  );
}
