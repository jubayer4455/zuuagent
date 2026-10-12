import React, { useState } from 'react';
import { 
  PlayCircle, 
  RotateCcw, 
  XCircle, 
  Search, 
  Filter, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Cpu, 
  Coins, 
  ExternalLink 
} from 'lucide-react';
import { useExecutionStore } from '../store/useExecutionStore';
import { useAgentStore } from '../store/useAgentStore';
import { Execution } from '../types';

export const TasksPage: React.FC = () => {
  const { executions, cancelExecution, retryExecution } = useExecutionStore();
  const { agents } = useAgentStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);

  const filteredExecutions = executions.filter(e => {
    const matchesSearch = (e.agentName?.toLowerCase().includes(search.toLowerCase()) || false) ||
                          e.correlationId.toLowerCase().includes(search.toLowerCase()) ||
                          JSON.stringify(e.inputPayload).toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleRetry = async (exec: Execution) => {
    const agent = agents.find(a => a.id === exec.agentId);
    if (!agent) {
      alert('Parent agent not found to retry execution.');
      return;
    }
    const retried = await retryExecution(exec.id, agent);
    if (retried) {
      alert(`Retried execution initiated: Correlation ID ${retried.correlationId}`);
      setSelectedExecution(retried);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">
          Tasks & Executions Center
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Durable execution history, correlation traces, step-by-step progress, and failure diagnostics.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search executions by agent name, correlation ID, or payload..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="awaiting_approval">Awaiting Approval</option>
          <option value="running">Running</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Main Grid: Execution List + Trace Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table / List */}
        <div className={`space-y-3 ${selectedExecution ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="border border-slate-800 rounded-xl bg-[#0f172a]/90 overflow-hidden">
            <div className="divide-y divide-slate-800/70">
              {filteredExecutions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No matching executions found.
                </div>
              ) : (
                filteredExecutions.map((exec) => (
                  <div
                    key={exec.id}
                    onClick={() => setSelectedExecution(exec)}
                    className={`p-4 hover:bg-slate-800/40 cursor-pointer transition flex items-center justify-between text-xs ${
                      selectedExecution?.id === exec.id ? 'bg-slate-800/60 border-l-2 border-cyan-400' : ''
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-200 text-sm">{exec.agentName}</span>
                        <span className="font-mono text-[10px] text-cyan-400">{exec.correlationId}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center space-x-2">
                        <span>Trigger: <strong className="text-slate-300 capitalize">{exec.triggerType}</strong></span>
                        <span>•</span>
                        <span>{new Date(exec.startedAt).toLocaleTimeString()}</span>
                        <span>•</span>
                        <span>{exec.durationMs ? `${exec.durationMs}ms` : 'In progress'}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        exec.status === 'completed'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : exec.status === 'awaiting_approval'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : exec.status === 'running'
                          ? 'bg-blue-950 text-blue-400 border border-blue-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {exec.status.replace('_', ' ')}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Detailed Trace Drawer */}
        {selectedExecution && (
          <div className="border border-slate-800 rounded-2xl bg-[#0f172a]/95 p-5 space-y-4 text-xs h-fit sticky top-20">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-100 text-sm">Execution Details</h3>
                <span className="font-mono text-[10px] text-cyan-400">{selectedExecution.correlationId}</span>
              </div>
              <button 
                onClick={() => setSelectedExecution(null)}
                className="text-slate-500 hover:text-slate-300"
              >
                ✕
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Tokens Used:</span>
                <div className="font-bold text-slate-200 mt-0.5">{selectedExecution.totalTokensUsed}</div>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Duration:</span>
                <div className="font-bold text-slate-200 mt-0.5">{selectedExecution.durationMs || 0}ms</div>
              </div>
            </div>

            {/* Steps Trace */}
            <div>
              <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">
                Step-by-Step Execution Trace:
              </span>
              <div className="mt-2 space-y-2 max-h-64 overflow-y-auto pr-1">
                {selectedExecution.steps?.map((step) => (
                  <div key={step.id} className="p-2.5 rounded bg-slate-900/80 border border-slate-800 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">
                        {step.stepNumber}. {step.stepName}
                      </span>
                      <span className={`text-[10px] font-bold uppercase ${
                        step.status === 'success' ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {step.status}
                      </span>
                    </div>
                    {step.durationMs && (
                      <div className="text-[10px] text-slate-500 mt-0.5">Latency: {step.durationMs}ms</div>
                    )}
                    {step.errorDetails && (
                      <div className="text-[10px] text-rose-400 mt-1">{step.errorDetails}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Outputs */}
            {selectedExecution.outputs?.[0] && (
              <div>
                <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">
                  Generated Output Result:
                </span>
                <div className="mt-1 p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
                  {selectedExecution.outputs[0].content}
                </div>
              </div>
            )}

            {/* Trace Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                onClick={() => handleRetry(selectedExecution)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Run</span>
              </button>

              {selectedExecution.status === 'running' && (
                <button
                  onClick={() => cancelExecution(selectedExecution.id)}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded bg-rose-950 hover:bg-rose-900 text-rose-300 font-semibold"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
