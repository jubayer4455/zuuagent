import React, { useState } from 'react';
import { Wrench, Shield, CheckCircle2, AlertTriangle, Code2 } from 'lucide-react';
import { initialTools } from '../data/initialData';
import { ToolDefinition } from '../types';

export const ToolRegistryPage: React.FC = () => {
  const [tools] = useState<ToolDefinition[]>(initialTools);
  const [selectedTool, setSelectedTool] = useState<ToolDefinition>(tools[0]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">Tool Registry</h1>
        <p className="text-slate-400 text-sm mt-1">
          Server-side validated tool ecosystem classified by side-effect boundaries and authorization gates.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tool List */}
        <div className="space-y-3">
          {tools.map((t) => (
            <div
              key={t.id}
              onClick={() => setSelectedTool(t)}
              className={`p-4 rounded-xl border cursor-pointer transition text-xs space-y-1.5 ${
                selectedTool.id === t.id 
                  ? 'border-cyan-500 bg-cyan-950/30' 
                  : 'border-slate-800 bg-[#0f172a]/90 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-100 text-sm">{t.displayName}</span>
                <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-mono ${
                  t.classification === 'external_mutation' 
                    ? 'bg-rose-950 text-rose-400 border border-rose-800'
                    : t.classification === 'external_communication'
                    ? 'bg-amber-950 text-amber-400 border border-amber-800'
                    : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                }`}>
                  {t.classification.replace('_', ' ')}
                </span>
              </div>
              <p className="text-slate-400 line-clamp-1">{t.description}</p>
              <div className="text-[10px] text-cyan-400 font-mono">Handler: {t.handlerIdentifier}</div>
            </div>
          ))}
        </div>

        {/* Detailed Schema Inspector */}
        <div className="lg:col-span-2 border border-slate-800 rounded-2xl bg-[#0f172a]/95 p-6 space-y-5 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-100">{selectedTool.displayName}</h2>
              <span className="font-mono text-[11px] text-cyan-400">{selectedTool.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              {selectedTool.requiresApproval && (
                <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 text-[10px] font-bold uppercase">
                  Approval Gate Enforced
                </span>
              )}
            </div>
          </div>

          <p className="text-slate-300 leading-relaxed">{selectedTool.description}</p>

          <div className="grid grid-cols-2 gap-3 text-[11px]">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-slate-400 uppercase font-bold text-[10px]">Required Permissions</span>
              <div className="font-mono text-cyan-400">{selectedTool.requiredPermissions.join(', ')}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-slate-400 uppercase font-bold text-[10px]">Rate Limit & Timeout</span>
              <div className="font-mono text-slate-200">{selectedTool.rateLimitPerMinute} rpm • {selectedTool.executionTimeoutMs / 1000}s timeout</div>
            </div>
          </div>

          {/* Input Schema JSON */}
          <div>
            <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">JSON Input Schema:</span>
            <pre className="mt-1.5 p-4 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 font-mono text-[11px] overflow-x-auto">
              {JSON.stringify(selectedTool.inputSchema, null, 2)}
            </pre>
          </div>

          {/* Output Schema JSON */}
          <div>
            <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">JSON Output Schema:</span>
            <pre className="mt-1.5 p-4 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-[11px] overflow-x-auto">
              {JSON.stringify(selectedTool.outputSchema, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
