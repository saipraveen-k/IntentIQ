'use client';
import { ArrowDown, Cpu, Shield, Search, Database, Layers, CheckCircle2 } from 'lucide-react';

const STAGES = [
  {
    step: 'Input',
    title: 'Shopper Context / Query',
    desc: 'Real-time session clicks or search query string input',
    icon: Search,
    color: 'border-slate-300 text-slate-500 bg-slate-50'
  },
  {
    step: 'Stage 1',
    title: 'Two-Tower & FAISS Retrieval',
    desc: 'Extract candidate embeddings & query IVF-PQ index in <1ms',
    icon: Database,
    color: 'border-indigo-200 text-indigo-600 bg-indigo-50/50'
  },
  {
    step: 'Stage 2',
    title: 'Multi-Task NCF Scoring',
    desc: 'Predict click, add-to-cart, & purchase probabilities via MLP',
    icon: Layers,
    color: 'border-sky-200 text-sky-600 bg-sky-50/50'
  },
  {
    step: 'Stage 3',
    title: 'Semantic Cross-Encoder',
    desc: 'MiniLM reranking with parallel SLA 40ms timeout guard',
    icon: Cpu,
    color: 'border-purple-200 text-purple-600 bg-purple-50/50'
  },
  {
    step: 'Stage 4',
    title: 'Smart Fallback Router',
    desc: 'Detects broad keywords to yield aisle popularity overrides',
    icon: Shield,
    color: 'border-amber-200 text-amber-600 bg-amber-50/50'
  },
  {
    step: 'Stage 5',
    title: 'DDPP Guardrails & Explanations',
    desc: 'Apply 35% department diversity capping and generate explainability reasons',
    icon: CheckCircle2,
    color: 'border-emerald-200 text-emerald-600 bg-emerald-50/50'
  }
];

export default function FlowDiagram() {
  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm mb-8 animate-fade-in">
      <h3 className="font-extrabold text-slate-800 text-base mb-6 flex items-center gap-2">
        <Layers className="w-5 h-5 text-indigo-500" /> Neural Processing Pipeline Flow
      </h3>
      
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 relative">
        {STAGES.map((stage, idx) => {
          const Icon = stage.icon;
          return (
            <div key={stage.step} className="flex-1 flex flex-col items-center text-center relative group">
              {/* Connector Line for Desktop */}
              {idx < STAGES.length - 1 && (
                <div className="hidden lg:block absolute top-7 left-[60%] w-[80%] h-0.5 border-t border-dashed border-slate-200 group-hover:border-indigo-500 transition-colors z-0"></div>
              )}
              
              {/* Connector Arrow for Mobile */}
              {idx > 0 && (
                <div className="lg:hidden my-2 text-slate-300">
                  <ArrowDown className="w-4 h-4 animate-bounce" />
                </div>
              )}

              {/* Icon Bubble */}
              <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center relative z-10 transition-all duration-200 group-hover:scale-105 shadow-sm ${stage.color}`}>
                <Icon className="w-6 h-6" />
              </div>

              {/* Labels */}
              <div className="mt-3 max-w-[150px]">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block leading-none">
                  {stage.step}
                </span>
                <h5 className="text-xs font-extrabold text-slate-800 mt-1 leading-snug">
                  {stage.title}
                </h5>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  {stage.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
