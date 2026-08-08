'use client';
import { useState, useEffect } from 'react';
import { Shield, EyeOff, ShieldAlert, Timer } from 'lucide-react';

export default function DPDPTerminal({ rawInput, sanitizedInput, piiLogs }) {
  const [timeLeft, setTimeLeft] = useState(300);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 300));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4 animate-fade-in">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm">DPDP Compliance & Memory Vault</h4>
            <p className="text-slate-400 text-[10px] mt-0.5">Real-time PII scrubbing proxy & token vault TTL</p>
          </div>
        </div>

        {/* Live Vault Timer */}
        <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1.5 animate-pulse">
          <Timer className="w-3.5 h-3.5" />
          Vault TTL: {formatTime(timeLeft)}
        </div>
      </div>

      {/* Side-by-Side Prompt Inspector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1.5">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Raw Shopper Input</span>
          <div className="bg-slate-900 text-slate-300 p-3 rounded-2xl text-[10px] font-mono shadow-inner min-h-[70px] overflow-x-auto no-scrollbar border border-slate-800">
            {rawInput || 'User session browsing: 12345 (No active search)'}
          </div>
        </div>
        <div className="space-y-1.5">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Sanitized Prompt Payload</span>
          <div className="bg-slate-900 text-emerald-400 p-3 rounded-2xl text-[10px] font-mono shadow-inner min-h-[70px] overflow-x-auto no-scrollbar border border-slate-800">
            {sanitizedInput || 'Sanitized session history passed to scorer Tower.'}
          </div>
        </div>
      </div>

      {/* PII Extraction List */}
      <div className="space-y-2">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
          <EyeOff className="w-3.5 h-3.5 text-slate-400" /> Active PII Mapping scrubbing logs
        </span>
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-2 max-h-[100px] overflow-y-auto no-scrollbar">
          {piiLogs && piiLogs.length > 0 ? (
            piiLogs.map((log, idx) => (
              <div key={idx} className="flex justify-between items-center text-[10px] font-mono bg-white border border-slate-100 px-3 py-1.5 rounded-xl animate-fade-in shadow-inner">
                <span className="text-slate-500 font-semibold">{log.raw}</span>
                <span className="text-slate-400 font-bold">→</span>
                <span className="text-indigo-600 font-bold bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded leading-none">
                  {log.scrubbed}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-2 text-slate-400 text-[10px] font-semibold flex items-center justify-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-slate-300" />
              No PII entities detected in current session sequence.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
