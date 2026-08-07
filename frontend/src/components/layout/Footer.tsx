'use client';

import React from 'react';
import { ShieldCheck, ExternalLink, Cpu } from 'lucide-react';
import { useStore } from '../../store/useStore';

export const Footer: React.FC = () => {
  const { togglePrivacyModal } = useStore();

  return (
    <footer className="border-t border-gray-200 bg-white mt-24 py-16 px-6 lg:px-12 text-gray-600">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        
        {/* Brand */}
        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              IQ
            </div>
            <span className="font-extrabold text-lg text-gray-900 tracking-tight">IntentIQ</span>
          </div>
          <p className="text-sm text-gray-500 max-w-md leading-relaxed">
            Curated Commerce Intelligence. Multi-signal shopper intent vectors, Instacart order basket co-occurrence graphs, and FAISS 384d semantic retrieval.
          </p>
          <div className="flex items-center gap-3 pt-2 text-xs text-gray-400">
            <span>Enterprise v3.2</span>
            <span>•</span>
            <span>Instacart Dataset</span>
            <span>•</span>
            <span>DPDP Act 2023 Compliant</span>
          </div>
        </div>

        {/* Architecture */}
        <div className="space-y-2.5 text-xs">
          <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">Architecture</h4>
          <ul className="space-y-2 text-gray-500">
            <li className="flex items-center gap-2"><Cpu className="w-3.5 h-3.5 text-slate-700" /> Intent Agent (EMA Update)</li>
            <li className="flex items-center gap-2"><Cpu className="w-3.5 h-3.5 text-slate-700" /> 8-Factor Ranking Engine</li>
            <li className="flex items-center gap-2"><Cpu className="w-3.5 h-3.5 text-slate-700" /> Recommendation Memory</li>
            <li className="flex items-center gap-2"><Cpu className="w-3.5 h-3.5 text-slate-700" /> FAISS 384d Vector Store</li>
          </ul>
        </div>

        {/* Governance */}
        <div className="space-y-2.5 text-xs">
          <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">Privacy & Control</h4>
          <div className="space-y-2 pt-1">
            <button
              onClick={togglePrivacyModal}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 border border-emerald-200 text-xs font-semibold transition-colors w-full justify-center"
            >
              <ShieldCheck className="w-4 h-4" />
              DPDP 2023 Privacy Purge
            </button>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto border-t border-gray-100 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-3">
        <p>© 2026 IntentIQ Platform. All rights reserved.</p>
        <p>Sub-1000ms SLA Target Verified • Instacart Dataset</p>
      </div>
    </footer>
  );
};

