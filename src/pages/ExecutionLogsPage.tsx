import React, { useState } from 'react';
import { FileText, Search, ShieldCheck, Terminal, Filter } from 'lucide-react';
import { useExecutionStore } from '../store/useExecutionStore';

export const ExecutionLogsPage: React.FC = () => {
  const { executions } = useExecutionStore();
  const [search, setSearch] = useState('');

  // Collect step traces across executions
  const allSteps = executions.flatMap(e => 
    (e.steps || []).map(s => ({
      ...s,
      agentName: e.agentName,
      correlationId: e.correlationId
    }))
  ).filter(s => 
    s.stepName.toLowerCase().includes(search.toLowerCase()) ||
    s.correlationId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">Execution Logs & Traces</h1>
          <p className="text-slate-400 text-sm mt-1">
            Structured server-side logs with correlation IDs, latency profiling, and sensitive token redaction.
          </p>
        </div>

        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Payload Redaction Active</span>
        </div>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Filter logs by step name or correlation ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
        />
      </div>

      <div className="border border-slate-800 rounded-2xl bg-slate-950 font-mono text-xs overflow-hidden">
        <div className="p-3 bg-slate-900/80 border-b border-slate-800 text-slate-400 text-[10px] uppercase font-bold flex items-center justify-between">
          <span>Server Trace Log Stream</span>
          <span>{allSteps.length} Trace Events</span>
        </div>

        <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto divide-y divide-slate-900">
          {allSteps.map(s => (
            <div key={s.id} className="pt-2 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 text-[11px]">
              <div className="flex items-center space-x-2">
                <span className="text-slate-500">{new Date(s.createdAt).toLocaleTimeString()}</span>
                <span className="text-cyan-400 font-bold">[{s.correlationId}]</span>
                <span className="text-slate-200 font-semibold">{s.stepName}</span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase ${
                  s.status === 'success' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                }`}>
                  {s.status}
                </span>
              </div>
              <div className="text-slate-500 text-[10px]">
                {s.durationMs ? `${s.durationMs}ms` : ''}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
