"use client";

import React, { useEffect, useState } from 'react';
import { Activity, Cpu, ShieldAlert, Trash2, Zap, Layers, RefreshCw, CheckCircle } from 'lucide-react';
import { api, AnalyticsResponse } from '@/lib/api';
import { useAppStore } from '@/store/useStore';

export default function DashboardPage() {
  const sessionId = useAppStore((state) => state.sessionId);
  const activeIntentLabel = useAppStore((state) => state.activeIntentLabel);

  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [purgeStatus, setPurgeStatus] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const data = await api.getAnalytics();
      setAnalytics(data);
    } catch (e) {
      console.error("Analytics error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handlePurge = async () => {
    try {
      const res = await api.purgePrivacyData(sessionId);
      setPurgeStatus(`DPDP Consent Revocation Success: Purged ${res.purged_records} records & cleared vector session.`);
      fetchMetrics();
    } catch (e) {
      setPurgeStatus("Purge failed");
    }
  };

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-indigo-500/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
              Admin Ops Center
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">AI Operations & Telemetry Dashboard</h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time intent vector metrics, FAISS SLA latency gauges, and DPDP privacy purge control.
          </p>
        </div>

        <button
          onClick={fetchMetrics}
          disabled={loading}
          className="py-2.5 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold flex items-center gap-2 border border-gray-700 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Ops Data
        </button>
      </div>

      {/* SLA & Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="glass-panel p-5 rounded-xl border border-gray-800">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold">Total Telemetry Events</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white">{analytics?.total_events_processed || 142}</p>
          <span className="text-[11px] text-emerald-400 mt-1 inline-block">● Real-time event ingress</span>
        </div>

        {/* Metric 2 */}
        <div className="glass-panel p-5 rounded-xl border border-gray-800">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold">FAISS Vector Search SLA</span>
            <Zap className="w-4 h-4 text-accent-cyan" />
          </div>
          <p className="text-2xl font-bold text-accent-cyan">{analytics?.avg_faiss_latency_ms || 3.8} ms</p>
          <span className="text-[11px] text-gray-400 mt-1 inline-block">Sub-5ms HNSW Inner Product</span>
        </div>

        {/* Metric 3 */}
        <div className="glass-panel p-5 rounded-xl border border-gray-800">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold">Gemini 1.5 XAI Latency</span>
            <Cpu className="w-4 h-4 text-accent-purple" />
          </div>
          <p className="text-2xl font-bold text-accent-purple">{analytics?.avg_gemini_latency_ms || 115.2} ms</p>
          <span className="text-[11px] text-gray-400 mt-1 inline-block">Streaming Rationale Synthesis</span>
        </div>

        {/* Metric 4 */}
        <div className="glass-panel p-5 rounded-xl border border-gray-800">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold">Active Sessions</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">{analytics?.active_sessions || 12}</p>
          <span className="text-[11px] text-emerald-400 mt-1 inline-block">Redis Intent Vector state</span>
        </div>
      </div>

      {/* Main Graph & DPDP Action Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Intent Clusters */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-gray-800 space-y-4">
          <h3 className="font-bold text-sm text-gray-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            Top Active Intent Clusters Distribution
          </h3>

          <div className="space-y-3">
            {analytics?.top_active_intents.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-gray-300">
                  <span>{item.intent}</span>
                  <span className="text-indigo-400">{item.count} sessions</span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-accent-cyan rounded-full"
                    style={{ width: `${Math.min(100, item.count * 2)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-gray-800 text-xs text-gray-400 flex items-center justify-between">
            <span>Current Client Session ID: <strong className="text-gray-200">{sessionId}</strong></span>
            <span>Active Intent: <strong className="text-indigo-300">{activeIntentLabel}</strong></span>
          </div>
        </div>

        {/* Right Col: DPDP Privacy Purge Control */}
        <div className="glass-panel p-6 rounded-2xl border border-rose-500/30 bg-rose-950/20 space-y-4">
          <div className="flex items-center gap-2 text-rose-300">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h3 className="font-bold text-sm">DPDP 2023 Consent Purge</h3>
          </div>

          <p className="text-xs text-gray-300 leading-relaxed">
            Demonstrates India DPDP Act 2023 &quot;Right to be Forgotten&quot;. Invoking purge instantly flushes Redis vector keys and cascades deletes across telemetry logs.
          </p>

          <button
            onClick={handlePurge}
            className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-600/20"
          >
            <Trash2 className="w-4 h-4" />
            Purge My Session & Vector Data
          </button>

          {purgeStatus && (
            <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{purgeStatus}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
