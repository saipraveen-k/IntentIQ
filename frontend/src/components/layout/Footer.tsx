'use client';

import React from 'react';
import { Brain, ShieldCheck, Github, ExternalLink, Cpu } from 'lucide-react';
import { useStore } from '../../store/useStore';

export const Footer: React.FC = () => {
  const { togglePrivacyModal } = useStore();

  return (
    <footer className="border-t border-white/10 glass-panel mt-20 py-12 px-4 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Col 1: Brand */}
        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Brain className="w-4 h-4 text-blue-400" />
            </div>
            <span className="font-bold text-lg text-white">IntentIQ</span>
          </div>
          <p className="text-sm text-slate-400 max-w-md">
            Understanding Shopper Intent, Not Just Shopper History. Powered by Fast HNSW FAISS vector similarity search, Sentence Transformers, and Gemini 1.5 Flash.
          </p>
          <div className="flex items-center gap-3 pt-2 text-xs text-slate-500">
            <span>AI Build 2026 Submission</span>
            <span>•</span>
            <span>Instacart MVP Provider</span>
            <span>•</span>
            <span>DPDP Act 2023 Compliant</span>
          </div>
        </div>

        {/* Col 2: Platform Architecture */}
        <div className="space-y-2 text-xs">
          <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">AI System Architecture</h4>
          <ul className="space-y-1.5 text-slate-400">
            <li className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-blue-400" /> AI Brain Orchestrator</li>
            <li className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-blue-400" /> Real-time Intent Agent</li>
            <li className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-blue-400" /> Hybrid Recommendation Engine</li>
            <li className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-blue-400" /> FAISS HNSW Vector Store</li>
          </ul>
        </div>

        {/* Col 3: Compliance & Links */}
        <div className="space-y-2 text-xs">
          <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">Governance & Links</h4>
          <div className="space-y-2 pt-1">
            <button
              onClick={togglePrivacyModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors w-full justify-center"
            >
              <ShieldCheck className="w-4 h-4" />
              DPDP 2023 Privacy Purge
            </button>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 transition-colors w-full justify-center"
            >
              <Github className="w-4 h-4" />
              GitHub Repository
              <ExternalLink className="w-3 h-3 ml-auto opacity-60" />
            </a>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto border-t border-white/5 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <p>© 2026 IntentIQ Team CodeX. Built for AI Build 2026 Hackathon.</p>
        <p>Sub-1000ms SLA Target Verified • Instacart Dataset Powered</p>
      </div>
    </footer>
  );
};
