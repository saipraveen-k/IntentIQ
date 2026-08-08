'use client';
import { Gauge, ShieldCheck } from 'lucide-react';

export default function LatencyTelemetry({ latencySteps }) {
  const steps = latencySteps || {
    anonymization: 4,
    retrieval: 18,
    reranking: 22,
    total: 68
  };

  const isCompliant = steps.total < 80;

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4 animate-fade-in">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm">Latency & SLA Telemetry Monitor</h4>
            <p className="text-slate-400 text-[10px] mt-0.5">Step-by-step pipeline timers and SLA threshold indicator</p>
          </div>
        </div>

        {/* SLA compliance badge */}
        <div className={`px-3 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1.5 ${
          isCompliant 
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
            : 'bg-rose-50 text-rose-700 border border-rose-100'
        }`}>
          <ShieldCheck className="w-3.5 h-3.5" />
          {isCompliant ? 'SLA Compliant (<80ms)' : 'SLA Breach (>=80ms)'}
        </div>
      </div>

      {/* Timers list */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex flex-col justify-between">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">PII Sanitization</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-black text-slate-800">{steps.anonymization}</span>
            <span className="text-[10px] text-slate-400 font-bold">ms</span>
          </div>
          <p className="text-[9px] text-slate-400 mt-1">DPDP compliance proxy scrubbing</p>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex flex-col justify-between">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">FAISS Retrieval</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-black text-slate-800">{steps.retrieval}</span>
            <span className="text-[10px] text-slate-400 font-bold">ms</span>
          </div>
          <p className="text-[9px] text-slate-400 mt-1">Two-Tower embedding candidate search</p>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex flex-col justify-between">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">NCF Reranking</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-black text-slate-800">{steps.reranking}</span>
            <span className="text-[10px] text-slate-400 font-bold">ms</span>
          </div>
          <p className="text-[9px] text-slate-400 mt-1">Multi-Task scoring head calculation</p>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex flex-col justify-between border-b-2 border-indigo-500">
          <span className="text-[9px] text-indigo-500 font-bold uppercase tracking-wider">Total Duration</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-black text-indigo-600">{steps.total}</span>
            <span className="text-[10px] text-indigo-500 font-bold">ms</span>
          </div>
          <p className="text-[9px] text-slate-400 mt-1">SLA Limit: 80.00ms</p>
        </div>
      </div>
    </div>
  );
}
