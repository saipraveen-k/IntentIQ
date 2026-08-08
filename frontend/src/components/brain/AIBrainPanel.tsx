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
    <section className="card-elevated p-6 lg:p-8">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        
        {/* Left Info Column */}
        <div className="space-y-4 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
            <Brain className="w-4 h-4" />
            <span>AI Intelligence Engine</span>
          </div>

          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
            Real-time intent analysis
            <button
              onClick={fetchBrainState}
              disabled={loading}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </h2>

          <p className="text-gray-500 text-sm leading-relaxed">
            Our AI analyzes your shopping patterns in real-time using search behavior, browsing history, and purchase data to personalize recommendations.
          </p>

          {/* Active Detected Signals Badges */}
          <div className="pt-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Active signals</span>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Search queries
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Basket history
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Browsing patterns
              </span>
            </div>
          </div>
        </div>

        {/* Right Active Intent Card & Confidence Gauge */}
        <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col gap-4">
          
          {/* Active Intent Gauge */}
          <div className="card-base p-5 min-w-[280px]">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
              <span className="font-semibold uppercase tracking-wider">Current intent</span>
              <span className="flex items-center gap-1 text-blue-600 font-bold">
                <Zap className="w-3.5 h-3.5" /> {lastLatency}ms
              </span>
            </div>
            
            <div className="text-xl font-bold text-gray-900 mb-3 flex items-center justify-between">
              <span>{activeIntentLabel}</span>
              <span className="text-2xl text-blue-600 font-extrabold">{Math.round(intentConfidence * 100)}%</span>
            </div>

            {/* Confidence Progress Bar */}
            <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.round(intentConfidence * 100)}%` }}
              />
            </div>
          </div>

          {/* Intent Timeline Sequence */}
          <div className="card-base p-4 text-xs">
            <span className="text-gray-500 font-semibold uppercase tracking-wider block mb-2">Session timeline</span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {timelineSteps.map((step, idx) => (
                <React.Fragment key={`${step}-${idx}`}>
                  <span className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap ${
                    idx === timelineSteps.length - 1
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {step}
                  </span>
                  {idx < timelineSteps.length - 1 && (
                    <span className="text-gray-300">→</span>
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
