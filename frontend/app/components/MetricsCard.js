'use client';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function MetricsCard({ metric }) {
  const isPositive = metric.changeType === 'increase';
  const isNegative = metric.changeType === 'decrease';

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-200 animate-fade-in flex flex-col justify-between">
      <div>
        <span className="text-xs font-semibold text-slate-400 block">{metric.label}</span>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-2xl font-black text-slate-800">{metric.value}</span>
          {metric.change && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
              isPositive 
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                : 'bg-rose-50 text-rose-600 border border-rose-100'
            }`}>
              {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {metric.change}
            </span>
          )}
        </div>
      </div>
      <p className="text-[10px] text-slate-400 mt-2 font-medium">{metric.description}</p>
    </div>
  );
}
