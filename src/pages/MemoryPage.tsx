import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Search, 
  Plus, 
  Pin, 
  Trash2, 
  Filter, 
  ShieldCheck, 
  Sparkles,
  Download
} from 'lucide-react';
import { useMemoryStore } from '../store/useMemoryStore';
import { useAgentStore } from '../store/useAgentStore';
import { MemoryCategory } from '../types';

export const MemoryPage: React.FC = () => {
  const { memories, addMemory, deleteMemory, togglePinMemory } = useMemoryStore();
  const { agents } = useAgentStore();

  const [search, setSearch] = useState('');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // New Memory Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('instruction');
  const [newAgentId, setNewAgentId] = useState<string>(agents[0]?.id || '');
  const [newScope, setNewScope] = useState<'agent' | 'global'>('agent');

  const filteredMemories = memories.filter(m => {
    const matchesSearch = (m.key?.toLowerCase().includes(search.toLowerCase()) || false) ||
                          m.content.toLowerCase().includes(search.toLowerCase());
    const matchesAgent = selectedAgentFilter === 'all' || 
                         (selectedAgentFilter === 'global' ? m.scope === 'global' : m.agentId === selectedAgentFilter);
    const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;
    return matchesSearch && matchesAgent && matchesCategory;
  });

  const handleAddSubmit = () => {
    if (!newContent.trim()) return;

    addMemory({
      agentId: newScope === 'agent' ? newAgentId : undefined,
      scope: newScope,
      category: newCategory,
      key: newKey.trim() || `mem_${Date.now()}`,
      content: newContent.trim(),
      priority: 10
    });

    setShowAddModal(false);
    setNewKey('');
    setNewContent('');
  };

  const categories: { id: MemoryCategory; label: string }[] = [
    { id: 'identity', label: 'Identity & Purpose' },
    { id: 'instruction', label: 'Admin Instructions' },
    { id: 'preference', label: 'Preferences' },
    { id: 'summary', label: 'Task Summaries' },
    { id: 'output', label: 'Historical Outputs' },
    { id: 'feedback', label: 'Approved Feedback' },
    { id: 'knowledge_ref', label: 'Knowledge References' },
    { id: 'insight', label: 'Performance Insights' },
    { id: 'workflow_state', label: 'Workflow State' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">
            Memory Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Scoped memory partitions, isolation policies, keyword retrieval, and provenance tracking.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Memory Record</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search memories by keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={selectedAgentFilter}
          onChange={(e) => setSelectedAgentFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none"
        >
          <option value="all">All Memory Scopes</option>
          <option value="global">Global Scope (All Agents)</option>
          {agents.map(a => (
            <option key={a.id} value={a.id}>{a.name} (Private Partition)</option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none"
        >
          <option value="all">All 9 Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Memory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMemories.map((mem) => {
          const agentName = agents.find(a => a.id === mem.agentId)?.name || 'Global Platform Scope';

          return (
            <div
              key={mem.id}
              className={`border rounded-xl p-5 space-y-3 transition flex flex-col justify-between ${
                mem.status === 'pinned' 
                  ? 'border-cyan-500/50 bg-cyan-950/20' 
                  : 'border-slate-800 bg-[#0f172a]/90'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-cyan-400 font-bold text-xs">{mem.key}</span>
                    <span className="px-2 py-0.5 rounded text-[9px] uppercase font-mono bg-slate-800 text-slate-300">
                      {mem.category}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => togglePinMemory(mem.id)}
                      className={`p-1 rounded hover:bg-slate-800 transition ${
                        mem.status === 'pinned' ? 'text-cyan-400' : 'text-slate-500'
                      }`}
                      title="Pin memory for high priority retrieval"
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteMemory(mem.id)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition"
                      title="Delete memory"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {mem.content}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="truncate max-w-[200px]">Scope: <strong className="text-slate-300">{agentName}</strong></span>
                <span>Priority: {mem.priority}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-100 text-base">Create Memory Record</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Scope</label>
                <select
                  value={newScope}
                  onChange={(e) => setNewScope(e.target.value as 'agent' | 'global')}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="agent">Agent-Specific (Isolated)</option>
                  <option value="global">Global (Platform-Wide)</option>
                </select>
              </div>

              {newScope === 'agent' && (
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Target Agent</label>
                  <select
                    value={newAgentId}
                    onChange={(e) => setNewAgentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none"
                  >
                    {agents.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as MemoryCategory)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Key Identifier</label>
                <input
                  type="text"
                  placeholder="e.g. style_tone_rule"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Memory Content</label>
              <textarea
                rows={4}
                placeholder="Enter instructions, preferences, or contextual rules..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSubmit}
                className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
              >
                Commit Memory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
