'use client';

import React, { useState, useEffect } from 'react';
import { Brain, Sparkles, Activity, CheckCircle2, TrendingUp, RefreshCw, Zap } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { api, BrainAnalyzeResponse } from '../../lib/api';

export const AIBrainPanel: React.FC = () => {
  const { sessionId, activeIntentLabel, intentConfidence, intentHistory, setActiveIntent } = useStore();
  const [brainData, setBrainData] = useState<BrainAnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastLatency, setLastLatency] = useState<number>(11.27);

  const fetchBrainState = async () => {
    setLoading(true);
    try {
      const data = await api.analyzeBrain(sessionId);
      setBrainData(data);
      if (data.intent) {
        setActiveIntent(data.intent.active_label, data.intent.confidence, data.intent.history_timeline);
      }
      if (data.latency && data.latency.TotalExecutionTime) {
        setLastLatency(data.latency.TotalExecutionTime);
      }
    } catch (err) {
      console.warn('AI Brain state fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrainState();
  }, [sessionId]);

  const timelineSteps = intentHistory.length > 0
    ? intentHistory.slice(-4).map((h) => h.intent_label)
    : ['Neutral Discovery', 'Fresh Produce', 'Organic Pantry', 'Healthy Breakfast'];

  return (
    <section className="relative overflow-hidden rounded-2xl glass-panel p-6 lg:p-8 border border-blue-500/30 shadow-2xl shadow-blue-500/10">
      
      {/* Background Ambient Glow */}
      <div className="ambient-glow glow-blue -top-20 -left-20 w-80 h-80 opacity-40" />
      <div className="ambient-glow glow-emerald -bottom-20 -right-20 w-80 h-80 opacity-30" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        
        {/* Left Info Column */}
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400">
            <Brain className="w-4 h-4 text-blue-400 animate-pulse" />
            <span>AI Shopping Brain Control Plane</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          </div>

          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Real-Time Intent Inference Engine
            <button
              onClick={fetchBrainState}
              disabled={loading}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Refresh AI Brain State"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          </h2>

          <p className="text-slate-400 text-sm leading-relaxed">
            IntentIQ recalculates shopper vector representations in real time using clickstream dwell time, search query decompositions, and Instacart basket sequence history.
          </p>

          {/* Active Detected Signals Badges */}
          <div className="pt-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Detected Real-Time Signals</span>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Search Queries
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Basket Evolution
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Clickstream Dwell Time
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Instacart Purchase Graph
              </span>
            </div>
          </div>
        </div>

        {/* Right Active Intent Card & Confidence Gauge */}
        <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col gap-4">
          
          {/* Active Intent Gauge */}
          <div className="glass-card p-5 rounded-xl border border-white/10 min-w-[280px]">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider">Inferred Active Intent</span>
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <Zap className="w-3.5 h-3.5" /> {lastLatency}ms SLA
              </span>
            </div>
            
            <div className="text-xl font-bold text-white mb-2 flex items-center justify-between">
              <span>{activeIntentLabel}</span>
              <span className="text-2xl text-emerald-400 font-extrabold">{Math.round(intentConfidence * 100)}%</span>
            </div>

            {/* Confidence Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.round(intentConfidence * 100)}%` }}
              />
            </div>
          </div>

          {/* Intent Timeline Sequence */}
          <div className="glass-card p-4 rounded-xl border border-white/10 text-xs">
            <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-2">Session Intent Timeline</span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {timelineSteps.map((step, idx) => (
                <React.Fragment key={`${step}-${idx}`}>
                  <span className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap ${
                    idx === timelineSteps.length - 1
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 font-semibold'
                      : 'bg-slate-800/80 text-slate-400'
                  }`}>
                    {step}
                  </span>
                  {idx < timelineSteps.length - 1 && (
                    <span className="text-slate-600 font-bold">→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

        </div>

      </div>

    </section>
  );
};
