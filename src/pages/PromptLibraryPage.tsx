import React, { useState } from 'react';
import { Terminal, Copy, Check, Sparkles, BookOpen, Clock } from 'lucide-react';
import { useAgentStore } from '../store/useAgentStore';

export const PromptLibraryPage: React.FC = () => {
  const { agents, promptVersions } = useAgentStore();
  const [selectedAgentId, setSelectedAgentId] = useState(agents[0]?.id || '');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const selectedAgent = agents.find(a => a.id === selectedAgentId);
  const versionsForAgent = promptVersions.filter(pv => pv.agentId === selectedAgentId);

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">Prompt & Instruction Library</h1>
        <p className="text-slate-400 text-sm mt-1">
          Version-controlled prompt templates, system instructions, and quality guidelines.
        </p>
      </div>

      <div className="flex items-center space-x-3">
        <label className="text-xs font-semibold uppercase text-slate-400">Select Agent:</label>
        <select
          value={selectedAgentId}
          onChange={(e) => setSelectedAgentId(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          {agents.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active System Prompt */}
        <div className="border border-slate-800 rounded-2xl bg-[#0f172a]/95 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Active System Prompt (Current)</h2>
              <span className="text-xs text-cyan-400 font-mono">Agent: {selectedAgent?.name}</span>
            </div>
            <button
              onClick={() => handleCopy(selectedAgent?.prompts?.[0]?.content || '', 'current')}
              className="flex items-center space-x-1 px-3 py-1.5 rounded bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
            >
              {copiedId === 'current' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === 'current' ? 'Copied' : 'Copy Prompt'}</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs whitespace-pre-line leading-relaxed max-h-96 overflow-y-auto">
            {selectedAgent?.prompts?.[0]?.content || 'No prompt configured.'}
          </div>
        </div>

        {/* Prompt Version Audit History */}
        <div className="border border-slate-800 rounded-2xl bg-[#0f172a]/95 p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Version History & Revisions</h2>
            <p className="text-xs text-slate-400 mt-0.5">Immutable version trail with rollback traceability.</p>
          </div>

          <div className="space-y-3">
            {versionsForAgent.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                Single base version active.
              </div>
            ) : (
              versionsForAgent.map(pv => (
                <div key={pv.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">Version {pv.version}</span>
                    <span className="text-[10px] text-slate-500">{new Date(pv.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{pv.changeSummary}</p>
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80 font-mono text-[11px] text-slate-300 line-clamp-3">
                    {pv.content}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
