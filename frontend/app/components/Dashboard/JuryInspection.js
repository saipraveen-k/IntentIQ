'use client';
import { Layers } from 'lucide-react';
import DPDPTerminal from './DPDPTerminal';
import LatencyTelemetry from './LatencyTelemetry';
import DiversityChart from './DiversityChart';
import CostMonitor from './CostMonitor';
import RetrievalFunnel from './RetrievalFunnel';

export default function JuryInspection({ 
  rawInput, 
  sanitizedInput, 
  piiLogs, 
  latencySteps, 
  products, 
  isSLM, 
  inferenceCost, 
  queryCount 
}) {
  return (
    <div className="space-y-6">
      
      {/* Header title */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-indigo-400">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-extrabold text-slate-800 text-base">Jury Diagnostics Inspection Console</h3>
          <p className="text-slate-400 text-xs mt-0.5">Real-time system health checks and model alignment telemetry</p>
        </div>
      </div>

      {/* Module 1: Latency Step Timers */}
      <LatencyTelemetry latencySteps={latencySteps} />

      {/* Module 2: DPDP Privacy Vault */}
      <DPDPTerminal rawInput={rawInput} sanitizedInput={sanitizedInput} piiLogs={piiLogs} />

      {/* Module 3: Diversity Caps */}
      <DiversityChart products={products} />

      {/* Module 4: Funnel and cos scores */}
      <RetrievalFunnel products={products} />

      {/* Module 5: Routing costs */}
      <CostMonitor isSLM={isSLM} inferenceCost={inferenceCost} queryCount={queryCount} />

    </div>
  );
}
