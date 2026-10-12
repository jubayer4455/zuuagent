import React, { useState } from 'react';
import { BookOpen, Plus, Trash2, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { useMemoryStore } from '../store/useMemoryStore';
import { useAgentStore } from '../store/useAgentStore';

export const KnowledgeBasePage: React.FC = () => {
  const { knowledgeDocs, addKnowledgeDoc, deleteKnowledgeDoc, assignDocToAgent } = useMemoryStore();
  const { agents } = useAgentStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAgentId, setTargetAgentId] = useState(agents[0]?.id || '');
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAdd = () => {
    if (!title.trim() || !content.trim()) return;
    addKnowledgeDoc({
      title,
      fileType: 'text/markdown',
      rawContent: content,
      assignedAgentIds: targetAgentId ? [targetAgentId] : []
    });
    setTitle('');
    setContent('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">Knowledge Base</h1>
          <p className="text-slate-400 text-sm mt-1">
            Institutional document references, text notes, and agent-specific reference assignments.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold shadow-lg shadow-cyan-950 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Upload / Add Knowledge Doc</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {knowledgeDocs.map((doc) => {
          const assignedAgents = agents.filter(a => doc.assignedAgentIds?.includes(a.id));

          return (
            <div key={doc.id} className="border border-slate-800 rounded-xl bg-[#0f172a]/90 p-5 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-lg bg-blue-950/60 text-blue-400 border border-blue-800/40">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100 text-xs line-clamp-1">{doc.title}</h3>
                      <span className="text-[10px] text-slate-500 font-mono">{doc.fileType}</span>
                    </div>
                  </div>
                  <button onClick={() => deleteKnowledgeDoc(doc.id)} className="text-slate-500 hover:text-rose-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {doc.rawContent && (
                  <p className="text-xs text-slate-300 line-clamp-3 bg-slate-950 p-2.5 rounded border border-slate-800/80 font-mono text-[11px]">
                    {doc.rawContent}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div>Assigned Agents: <strong className="text-cyan-400">{assignedAgents.map(a => a.name).join(', ') || 'Global Platform'}</strong></div>
                <div className="text-[10px] text-emerald-400 font-semibold uppercase">Status: {doc.processingStatus}</div>
              </div>
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-100 text-base">Add Knowledge Reference Document</h3>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Document Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Bangladesh Social Engagement Playbook 2026.md"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Assign to Agent</label>
              <select
                value={targetAgentId}
                onChange={(e) => setTargetAgentId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none"
              >
                {agents.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Raw Content / Knowledge Notes</label>
              <textarea
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste institutional notes, guidelines, or factual context..."
                className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none font-mono"
              />
            </div>
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded bg-slate-800 text-slate-300 text-xs font-semibold">Cancel</button>
              <button onClick={handleAdd} className="px-5 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold">Save Document</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
