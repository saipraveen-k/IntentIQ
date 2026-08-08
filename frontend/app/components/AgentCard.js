'use client';
import * as Icons from 'lucide-react';

export default function AgentCard({ agent }) {
  // Dynamically resolve lucide-react icon component
  const IconComponent = Icons[agent.icon] || Icons.Cpu;

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-5 hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between animate-fade-in">
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <IconComponent className="w-5 h-5" />
          </div>
          <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200/50 px-2 py-0.5 rounded-full font-bold">
            {agent.performance}
          </span>
        </div>
        <h4 className="font-extrabold text-slate-800 text-sm mb-2">{agent.name}</h4>
        <p className="text-xs text-slate-500 leading-relaxed mb-4">{agent.description}</p>
      </div>

      <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-500 flex flex-col gap-0.5">
        <span className="text-slate-400 font-semibold uppercase tracking-wider text-[8px]">Specification:</span>
        <span className="truncate text-slate-600">{agent.technicalDetails}</span>
      </div>
    </div>
  );
}
