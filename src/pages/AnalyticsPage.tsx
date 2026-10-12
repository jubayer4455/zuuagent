import React from 'react';
import { BarChart3, TrendingUp, Download, PieChart, Clock, Cpu, Coins } from 'lucide-react';
import { useExecutionStore } from '../store/useExecutionStore';
import { useAgentStore } from '../store/useAgentStore';

export const AnalyticsPage: React.FC = () => {
  const { executions } = useExecutionStore();
  const { agents } = useAgentStore();

  const totalRuns = executions.length;
  const successfulRuns = executions.filter(e => e.status === 'completed').length;
  const successRate = totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 0;
  const totalTokens = executions.reduce((acc, curr) => acc + (curr.totalTokensUsed || 0), 0);
  const totalCost = executions.reduce((acc, curr) => acc + (curr.estimatedCost || 0), 0);
  const avgDurationMs = totalRuns > 0 
    ? Math.round(executions.reduce((acc, curr) => acc + (curr.durationMs || 0), 0) / totalRuns)
    : 0;

  const handleExportCSV = () => {
    const headers = ['ExecutionId', 'Agent', 'Status', 'Trigger', 'Tokens', 'CostUSD', 'DurationMs', 'StartedAt'];
    const rows = executions.map(e => [
      e.id,
      e.agentName || 'Agent',
      e.status,
      e.triggerType,
      e.totalTokensUsed,
      e.estimatedCost,
      e.durationMs || 0,
      e.startedAt
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `zuu_agent_analytics_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">Analytics & Telemetry</h1>
          <p className="text-slate-400 text-sm mt-1">
            Operational metrics, provider token utilization, latency profiles, and cost estimations.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Analytics CSV</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-[#0f172a]/90">
          <span className="text-xs font-semibold text-slate-400 uppercase">Execution Success Rate</span>
          <div className="text-2xl font-extrabold text-emerald-400 mt-2">{successRate}%</div>
          <div className="text-[11px] text-slate-500 mt-1">{successfulRuns} of {totalRuns} succeeded</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-[#0f172a]/90">
          <span className="text-xs font-semibold text-slate-400 uppercase">Average Latency</span>
          <div className="text-2xl font-extrabold text-cyan-400 mt-2">{avgDurationMs}ms</div>
          <div className="text-[11px] text-slate-500 mt-1">End-to-end pipeline speed</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-[#0f172a]/90">
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Tokens Processed</span>
          <div className="text-2xl font-extrabold text-slate-100 mt-2">{totalTokens.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-1">Inference + tool synthesis</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-[#0f172a]/90">
          <span className="text-xs font-semibold text-slate-400 uppercase">Estimated Model Cost</span>
          <div className="text-2xl font-extrabold text-violet-400 mt-2">${totalCost.toFixed(5)}</div>
          <div className="text-[11px] text-slate-500 mt-1">Estimated based on published provider rates</div>
        </div>
      </div>

      {/* Execution Distribution by Agent */}
      <div className="border border-slate-800 rounded-2xl bg-[#0f172a]/95 p-6 space-y-4">
        <h2 className="text-sm font-bold uppercase text-slate-200 tracking-wider">
          Workload Distribution Across Agent Fleet
        </h2>

        <div className="space-y-3">
          {agents.map((a) => {
            const count = executions.filter(e => e.agentId === a.id).length;
            const percentage = totalRuns > 0 ? Math.round((count / totalRuns) * 100) : 0;

            return (
              <div key={a.id} className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">{a.name}</span>
                  <span className="text-slate-400 font-mono">{count} runs ({percentage}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
