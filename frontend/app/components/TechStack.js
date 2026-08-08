'use client';
import { Layers } from 'lucide-react';

const TECHS = [
  { name: 'PyTorch', desc: 'Model architectures & hidden states inference', color: 'bg-orange-50 text-orange-600 border-orange-100' },
  { name: 'FAISS', desc: 'IVF-PQ vector quantization search index', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  { name: 'FastAPI', desc: 'Asynchronous gateway with gathering logic', color: 'bg-teal-50 text-teal-600 border-teal-100' },
  { name: 'Next.js 14', desc: 'App Router with Context state caching', color: 'bg-slate-50 text-slate-800 border-slate-200' },
  { name: 'Tailwind CSS', desc: 'Pure CSS styling layout', color: 'bg-sky-50 text-sky-600 border-sky-100' },
  { name: 'Redis', desc: 'Distributed caching state store (simulated)', color: 'bg-rose-50 text-rose-600 border-rose-100' },
  { name: 'PostgreSQL', desc: 'Instacart core transactional catalog', color: 'bg-blue-50 text-blue-600 border-blue-100' },
  { name: 'Transformers', desc: 'MiniLM-L6 Cross-Encoder semantic query reranker', color: 'bg-purple-50 text-purple-600 border-purple-100' }
];

export default function TechStack() {
  return (
    <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm mb-8 animate-fade-in">
      <h3 className="font-extrabold text-slate-800 text-base mb-4 flex items-center gap-2">
        <Layers className="w-5 h-5 text-indigo-500" /> Technologies & Frameworks
      </h3>
      <div className="flex flex-wrap gap-2.5">
        {TECHS.map((tech) => (
          <div 
            key={tech.name}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex flex-col gap-0.5 max-w-[200px] cursor-default hover:shadow-sm transition-all duration-200 ${tech.color}`}
          >
            <span>{tech.name}</span>
            <span className="text-[9px] font-medium opacity-85 leading-normal">{tech.desc}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
