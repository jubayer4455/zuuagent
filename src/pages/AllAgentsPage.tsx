import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, 
  Plus, 
  Search, 
  Filter, 
  Play, 
  Pause, 
  Copy, 
  Archive, 
  Trash2, 
  ChevronRight,
  Sparkles,
  Cpu,
  Clock
} from 'lucide-react';
import { useAgentStore } from '../store/useAgentStore';
import { useExecutionStore } from '../store/useExecutionStore';
import { Agent, AgentStatus } from '../types';

export const AllAgentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { agents, setAgentStatus, duplicateAgent, archiveAgent } = useAgentStore();
  const { triggerAgentExecution, isExecuting } = useExecutionStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [quickRunModalAgent, setQuickRunModalAgent] = useState<Agent | null>(null);
  const [taskInput, setTaskInput] = useState('');

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(search.toLowerCase()) ||
                          agent.description.toLowerCase().includes(search.toLowerCase()) ||
                          agent.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDuplicate = (agent: Agent) => {
    const duplicated = duplicateAgent(agent.id);
    if (duplicated) {
      alert(`Agent duplicated safely as "${duplicated.name}". Initialized in draft status.`);
    }
  };

  const handleQuickRun = async () => {
    if (!quickRunModalAgent) return;
    const prompt = taskInput.trim() || 'Execute default agent objective';
    await triggerAgentExecution(quickRunModalAgent, prompt, { isDryRun: true });
    setQuickRunModalAgent(null);
    setTaskInput('');
    navigate('/tasks');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">
            All AI Agents
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage, configure, test, and control independent agent instances and lifecycles.
          </p>
        </div>

        <button
          onClick={() => navigate('/agents/new')}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Agent</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search agents by name, description, or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="draft">Draft</option>
            <option value="disabled">Disabled</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAgents.map((agent) => (
          <div 
            key={agent.id}
            className="border border-slate-800 rounded-xl bg-[#0f172a]/90 hover:border-slate-700 transition flex flex-col justify-between"
          >
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
                    {agent.icon === 'sparkles' ? <Sparkles className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 
                      onClick={() => navigate(`/agents/${agent.id}`)}
                      className="font-bold text-slate-100 hover:text-cyan-400 cursor-pointer text-sm"
                    >
                      {agent.name}
                    </h3>
                    <span className="text-[11px] text-slate-500 capitalize">{agent.category.replace('_', ' ')}</span>
                  </div>
                </div>

                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                  agent.status === 'active' 
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                    : agent.status === 'paused'
                    ? 'bg-amber-950 text-amber-400 border border-amber-800'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {agent.status}
                </span>
              </div>

              <p className="text-xs text-slate-400 mt-3 line-clamp-2">
                {agent.description}
              </p>

              {/* Tags */}
              <div className="mt-3 flex flex-wrap gap-1">
                {agent.tags.map(t => (
                  <span key={t} className="px-1.5 py-0.5 text-[10px] rounded bg-slate-800/80 text-slate-400 border border-slate-700/50">
                    #{t}
                  </span>
                ))}
              </div>

              {/* Agent Specs */}
              <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-mono text-slate-300 truncate">{agent.primaryModel}</span>
                </div>
                <div className="flex items-center space-x-1.5 justify-end">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>v{agent.version} config</span>
                </div>
              </div>
            </div>

            {/* Card Actions Footer */}
            <div className="px-5 py-3 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                {agent.status === 'active' ? (
                  <button
                    onClick={() => setAgentStatus(agent.id, 'paused')}
                    className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition"
                    title="Pause Agent"
                  >
                    <Pause className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setAgentStatus(agent.id, 'active')}
                    className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition"
                    title="Resume / Activate Agent"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => handleDuplicate(agent)}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition"
                  title="Duplicate Agent"
                >
                  <Copy className="w-4 h-4" />
                </button>

                <button
                  onClick={() => archiveAgent(agent.id)}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition"
                  title="Archive Agent"
                >
                  <Archive className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setQuickRunModalAgent(agent)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 font-medium transition"
                >
                  Run Task
                </button>

                <button
                  onClick={() => navigate(`/agents/${agent.id}`)}
                  className="p-1 rounded text-slate-400 hover:text-slate-100"
                  title="Open Workspace"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Run Modal */}
      {quickRunModalAgent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-base">
                Trigger Task: {quickRunModalAgent.name}
              </h3>
              <button 
                onClick={() => setQuickRunModalAgent(null)}
                className="text-slate-500 hover:text-slate-300"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Task Input / Prompt
              </label>
              <textarea
                rows={4}
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                placeholder="Enter the task prompt, topic, or content prompt for the agent..."
                className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-sans"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Will execute through the controlled 16-step execution pipeline in Dry-Run mode.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setQuickRunModalAgent(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleQuickRun}
                disabled={isExecuting}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950"
              >
                {isExecuting ? 'Starting Pipeline...' : 'Run Pipeline Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
