'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Cpu, Zap, Activity, CheckCircle2, RefreshCw } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { api, BrainAnalyzeResponse } from '../../lib/api';

export const AIBrainPanel: React.FC = () => {
  const { sessionId, activeIntentLabel, intentConfidence, intentHistory, setActiveIntent } = useStore();
  const [isOpen, setIsOpen] = useState(false);
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
      console.warn('Shopping Intelligence notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !brainData) {
      fetchBrainState();
    }
  }, [isOpen, sessionId]);

  const timelineSteps = intentHistory.length > 0
    ? intentHistory.slice(-4).map((h) => h.intent_label)
    : ['Neutral Discovery', 'Fresh Produce', 'Organic Pantry', 'Healthy Breakfast'];

  return (
    <section className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden transition-all">
      
      {/* Collapsed Bar Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50/80 transition-colors text-left outline-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900">Shopping Intelligence Drawer</h3>
            <p className="text-xs text-gray-500">Inspect real-time decision traces, intent vectors, and SLA latencies</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Active SLA: {lastLatency}ms
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </div>
      </button>

      {/* Expanded Technical Intelligence Content */}
      {isOpen && (
        <div className="p-6 border-t border-gray-100 bg-gray-50/50 space-y-6 animate-fadeIn">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Active Intent & Confidence */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">Inferred Active Intent</span>
              <div className="text-xl font-bold text-gray-900">{activeIntentLabel}</div>
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 pt-1">
                <span>Confidence Agreement</span>
                <span>{Math.round(intentConfidence * 100)}%</span>
              </div>
            </div>

            {/* Signal Inputs */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">Active Signal Inputs</span>
              <div className="space-y-1.5 text-xs text-gray-700">
                <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Vector Similarity (FAISS 384d)
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Instacart Basket Co-Occurrence
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> EMA Clickstream Dwell Updates
                </div>
              </div>
            </div>

            {/* Agent SLA Latencies */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Agent SLAs</span>
                <button onClick={fetchBrainState} disabled={loading} className="text-gray-400 hover:text-gray-900">
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>Intent: <span className="text-gray-900 font-bold">1.2ms</span></div>
                <div>Search: <span className="text-gray-900 font-bold">3.2ms</span></div>
                <div>Ranking: <span className="text-gray-900 font-bold">4.5ms</span></div>
                <div>XAI: <span className="text-gray-900 font-bold">18.2ms</span></div>
              </div>
            </div>

          </div>

          {/* Timeline Sequence */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 text-xs">
            <span className="text-gray-400 font-bold uppercase tracking-wider block mb-2">Vector Timeline Sequence</span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {timelineSteps.map((step, idx) => (
                <React.Fragment key={`${step}-${idx}`}>
                  <span className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap ${
                    idx === timelineSteps.length - 1
                      ? 'bg-slate-900 text-white font-bold'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {step}
                  </span>
                  {idx < timelineSteps.length - 1 && <span className="text-gray-400 font-bold">→</span>}
                </React.Fragment>
              ))}
            </div>
          </div>

        </div>
      )}

    </section>
  );
};

