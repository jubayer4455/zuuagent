import React, { useState } from 'react';
import { Coins, ShieldAlert, Save, AlertTriangle } from 'lucide-react';

export const UsageCostControlsPage: React.FC = () => {
  const [dailyExecLimit, setDailyExecLimit] = useState(500);
  const [maxConcurrency, setMaxConcurrency] = useState(10);
  const [maxToolCallsPerRun, setMaxToolCallsPerRun] = useState(8);
  const [maxDelegationDepth, setMaxDelegationDepth] = useState(3);
  const [monthlyBudgetUsd, setMonthlyBudgetUsd] = useState(50.0);
  const [hardCapEnabled, setHardCapEnabled] = useState(true);

  const handleSave = () => {
    alert('Global usage limits and cost throttle parameters saved.');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">Usage & Cost Controls</h1>
          <p className="text-slate-400 text-sm mt-1">
            Enforce daily execution throttles, provider request caps, tool invocation ceilings, and cost quotas.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold shadow"
        >
          <Save className="w-4 h-4" />
          <span>Save Quotas & Limits</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Execution & Concurrency */}
        <div className="border border-slate-800 rounded-2xl bg-[#0f172a]/95 p-6 space-y-4">
          <h2 className="text-xs font-bold uppercase text-slate-300 tracking-wider">
            Execution Throttling & Safety Caps
          </h2>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
              Max Daily Executions (Global Fleet)
            </label>
            <input
              type="number"
              value={dailyExecLimit}
              onChange={(e) => setDailyExecLimit(parseInt(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
            />
            <p className="text-[10px] text-slate-500 mt-1">Stops run loops from generating excessive calls.</p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
              Max Concurrent Running Tasks
            </label>
            <input
              type="number"
              value={maxConcurrency}
              onChange={(e) => setMaxConcurrency(parseInt(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
              Max Tool Calls Per Single Execution
            </label>
            <input
              type="number"
              value={maxToolCallsPerRun}
              onChange={(e) => setMaxToolCallsPerRun(parseInt(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
            />
            <p className="text-[10px] text-slate-500 mt-1">Prevents runaway autonomous agent tool cycles.</p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
              Max Agent-to-Agent Delegation Depth
            </label>
            <input
              type="number"
              value={maxDelegationDepth}
              onChange={(e) => setMaxDelegationDepth(parseInt(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
            />
          </div>
        </div>

        {/* Financial Budgets */}
        <div className="border border-slate-800 rounded-2xl bg-[#0f172a]/95 p-6 space-y-4">
          <h2 className="text-xs font-bold uppercase text-slate-300 tracking-wider">
            Budget Quotas & Hard Throttles
          </h2>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
              Estimated Monthly Budget Soft Cap ($ USD)
            </label>
            <input
              type="number"
              step="5.00"
              value={monthlyBudgetUsd}
              onChange={(e) => setMonthlyBudgetUsd(parseFloat(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none font-mono"
            />
            <p className="text-[10px] text-slate-500 mt-1">Alerts administrators via in-app notification when reached.</p>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-start space-x-3">
            <input
              type="checkbox"
              id="hardCap"
              checked={hardCapEnabled}
              onChange={(e) => setHardCapEnabled(e.target.checked)}
              className="mt-0.5 rounded bg-slate-900 border-slate-800 text-cyan-500"
            />
            <label htmlFor="hardCap" className="text-slate-300 cursor-pointer">
              <span className="font-bold text-slate-100">Hard Cap Enforcement:</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Automatically pause non-critical background jobs if the monthly estimate exceeds budget.
              </p>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
