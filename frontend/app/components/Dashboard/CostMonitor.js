'use client';
import { DollarSign, Cpu } from 'lucide-react';

export default function CostMonitor({ isSLM, inferenceCost, queryCount }) {
  const currentQueryCost = isSLM ? 0.00002 : 0.00012;

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4 animate-fade-in">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm">AI Routing & Inference Costs</h4>
            <p className="text-slate-400 text-[10px] mt-0.5">Telemetry tracking query routing targets and economics</p>
          </div>
        </div>

        {/* Model Route Badge */}
        <div className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border flex items-center gap-1.5 ${
          isSLM 
            ? 'bg-sky-50 text-sky-700 border-sky-100' 
            : 'bg-indigo-50 text-indigo-700 border-indigo-100'
        }`}>
          <Cpu className="w-3.5 h-3.5" />
          {isSLM ? 'Local Phi-3 SLM Route' : 'Cloud LLM RAG Route'}
        </div>
      </div>

      {/* Stats list */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex flex-col justify-between">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Single Query Rate</span>
          <span className="text-lg font-black text-slate-800 mt-1 block">
            ${currentQueryCost.toFixed(5)}
          </span>
          <p className="text-[9px] text-slate-400 mt-1">Based on routing tokens</p>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex flex-col justify-between">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Total Request Volume</span>
          <span className="text-lg font-black text-slate-800 mt-1 block">
            {queryCount}
          </span>
          <p className="text-[9px] text-slate-400 mt-1">Simulated query count</p>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex flex-col justify-between border-b-2 border-indigo-500">
          <span className="text-[9px] text-indigo-500 font-bold uppercase tracking-wider block">Cumulative Session Cost</span>
          <span className="text-lg font-black text-indigo-600 mt-1 block">
            ${inferenceCost.toFixed(5)}
          </span>
          <p className="text-[9px] text-slate-400 mt-1">Sum of processed inferences</p>
        </div>
      </div>
    </div>
  );
}
