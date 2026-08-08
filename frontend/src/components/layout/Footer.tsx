'use client';

import React from 'react';
import { Brain, ShieldCheck, Github, ExternalLink, Cpu } from 'lucide-react';
import { useStore } from '../../store/useStore';

export const Footer: React.FC = () => {
  const { togglePrivacyModal } = useStore();

  return (
    <footer className="border-t border-gray-200 bg-white mt-20 py-12 px-4 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Col 1: Brand */}
        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-lg text-gray-900">IntentIQ</span>
          </div>
          <p className="text-sm text-gray-500 max-w-md">
            AI-powered shopping recommendations. Understanding your preferences to suggest products you'll love.
          </p>
          <div className="flex items-center gap-3 pt-2 text-xs text-gray-400">
            <span>AI Build 2026</span>
            <span>•</span>
            <span>Privacy First</span>
          </div>
        </div>

        {/* Col 2: Platform Architecture */}
        <div className="space-y-2 text-xs">
          <h4 className="font-semibold text-gray-900 uppercase tracking-wider text-[11px]">Technology</h4>
          <ul className="space-y-1.5 text-gray-500">
            <li className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-gray-400" /> AI Intent Engine</li>
            <li className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-gray-400" /> Real-time Analysis</li>
            <li className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-gray-400" /> Vector Search</li>
            <li className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-gray-400" /> Smart Recommendations</li>
          </ul>
        </div>

        {/* Col 3: Compliance & Links */}
        <div className="space-y-2 text-xs">
          <h4 className="font-semibold text-gray-900 uppercase tracking-wider text-[11px]">Quick Links</h4>
          <div className="space-y-2 pt-1">
            <button
              onClick={togglePrivacyModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors w-full justify-center"
            >
              <ShieldCheck className="w-4 h-4" />
              Privacy Settings
            </button>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors w-full justify-center"
            >
              <Github className="w-4 h-4" />
              GitHub
              <ExternalLink className="w-3 h-3 ml-auto opacity-60" />
            </a>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto border-t border-gray-100 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-2">
        <p>© 2026 IntentIQ. Built for AI Build 2026.</p>
        <p>Fast & Accurate Recommendations</p>
      </div>
    </footer>
  );
};
