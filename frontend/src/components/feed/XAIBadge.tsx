"use client";

import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface XAIBadgeProps {
  explanation?: string;
  matchScore?: number;
}

export const XAIBadge: React.FC<XAIBadgeProps> = ({ explanation, matchScore }) => {
  if (!explanation) return null;

  const scorePct = matchScore ? Math.round(matchScore * 100) : 88;

  return (
    <div className="mt-2 p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-xs text-indigo-200 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-1.5 mb-1 font-medium text-indigo-400">
        <span className="flex items-center gap-1 text-[11px]">
          <Sparkles className="w-3.5 h-3.5 text-accent-cyan animate-pulse" />
          IntentIQ XAI Rationale
        </span>
        {matchScore && (
          <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            {scorePct}% Match
          </span>
        )}
      </div>
      <p className="leading-snug text-gray-300 italic">{explanation}</p>
    </div>
  );
};
