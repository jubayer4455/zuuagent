import React, { useState } from 'react';
import { Activity, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, Database, Cpu, Share2 } from 'lucide-react';
import { useSystemStore } from '../store/useSystemStore';
import { getDatabaseConnectionInfo } from '../services/supabase';

export const SystemHealthPage: React.FC = () => {
  const { healthMetrics, runHealthCheck } = useSystemStore();
  const [isChecking, setIsChecking] = useState(false);

  const dbInfo = getDatabaseConnectionInfo();

  const handleRunChecks = async () => {
    setIsChecking(true);
    await runHealthCheck();
    setIsChecking(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">System Health & Diagnostics</h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time probing of database connectivity, provider adapters, Graph API, scheduler, and secrets vault.
          </p>
        </div>

        <button
          onClick={handleRunChecks}
          disabled={isChecking}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold shadow transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
          <span>{isChecking ? 'Probing Services...' : 'Run Full Health Probe'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {healthMetrics.map((metric) => (
          <div key={metric.component} className="border border-slate-800 rounded-xl bg-[#0f172a]/90 p-5 space-y-3 text-xs">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2.5">
                <div className={`p-2 rounded-lg border ${
                  metric.status === 'healthy' 
                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40' 
                    : 'bg-amber-950/60 text-amber-400 border-amber-800/40'
                }`}>
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-xs">{metric.component}</h3>
                  <span className="text-[10px] text-slate-500">
                    Checked {new Date(metric.lastChecked).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                metric.status === 'healthy' 
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                  : 'bg-amber-950 text-amber-400 border border-amber-800'
              }`}>
                {metric.status}
              </span>
            </div>

            <p className="text-slate-300 leading-relaxed">{metric.message}</p>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
              <span>Latency: <strong className="text-cyan-400 font-mono">{metric.latencyMs}ms</strong></span>
              <span>Truthful Probe</span>
            </div>
          </div>
        ))}
      </div>

      {/* Database Connection Specs */}
      <div className="border border-slate-800 rounded-2xl bg-[#0f172a]/95 p-6 space-y-3 text-xs">
        <h2 className="text-sm font-bold uppercase text-slate-200 tracking-wider">Database Connection Specification</h2>
        <div className="space-y-1 text-slate-400">
          <div>Configured URL: <span className="font-mono text-cyan-400">{dbInfo.url}</span></div>
          <div>Mode: <strong className="text-slate-200">{dbInfo.mode}</strong></div>
          <p className="text-[11px] text-slate-400 pt-1">{dbInfo.notes}</p>
        </div>
      </div>
    </div>
  );
};
