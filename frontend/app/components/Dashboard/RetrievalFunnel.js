'use client';
import { Filter } from 'lucide-react';

export default function RetrievalFunnel({ products }) {
  // Mock retrieved embedding scoring list
  const mockEmbeddingScores = [
    { name: "Bag of Organic Bananas", cosine: "0.8924", affinity: "0.9415" },
    { name: "Organic Hass Avocado", cosine: "0.8651", affinity: "0.9120" },
    { name: "Organic Whole Milk", cosine: "0.8417", affinity: "0.8845" },
    { name: "Organic Strawberries", cosine: "0.8190", affinity: "0.8530" }
  ];

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
          <Filter className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-extrabold text-slate-800 text-sm">Vector Retrieval Funnel</h4>
          <p className="text-slate-400 text-[10px] mt-0.5">Visually track ANN search indexing and candidate reduction</p>
        </div>
      </div>

      {/* Visual Funnel */}
      <div className="flex flex-col gap-2 relative">
        <div className="flex justify-between items-center text-[10px] bg-slate-50 border border-slate-200/50 rounded-xl px-3 py-2">
          <span className="font-bold text-slate-500">1. Total Instacart Catalog</span>
          <span className="font-black text-slate-700">1,000,000 Products</span>
        </div>
        
        <div className="w-[90%] mx-auto flex justify-between items-center text-[10px] bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 relative">
          <span className="font-bold text-indigo-500">2. FAISS ANN Search (K=100)</span>
          <span className="font-black text-indigo-600">100 Candidates</span>
        </div>

        <div className="w-[80%] mx-auto flex justify-between items-center text-[10px] bg-indigo-600 text-white rounded-xl px-3 py-2 relative shadow-md">
          <span className="font-bold text-indigo-100">3. Multi-Task NCF Slate (K=20)</span>
          <span className="font-black">20 Final Items</span>
        </div>
      </div>

      {/* Embedding Score Inspector */}
      <div className="space-y-2">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Cosine Similarity Affinity Inspector</span>
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-2 max-h-[140px] overflow-y-auto no-scrollbar">
          {mockEmbeddingScores.map((score, idx) => (
            <div key={idx} className="flex justify-between items-center text-[10px] bg-white border border-slate-100 rounded-xl px-3 py-2 shadow-inner">
              <span className="font-bold text-slate-800 line-clamp-1 max-w-[150px]">{score.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-slate-400">
                  Cosine: <span className="font-bold text-slate-700">{score.cosine}</span>
                </span>
                <span className="text-slate-400">
                  Affinity: <span className="font-bold text-indigo-600">{score.affinity}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
