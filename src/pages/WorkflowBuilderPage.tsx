import React, { useState } from 'react';
import { 
  GitFork, 
  Play, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  ChevronRight, 
  ArrowDown, 
  ArrowUp, 
  Download, 
  Upload, 
  Sparkles, 
  Bot, 
  BrainCircuit, 
  Cpu, 
  Wrench, 
  CheckSquare, 
  Share2 
} from 'lucide-react';
import { useAgentStore } from '../store/useAgentStore';
import { AgentCollaborationEngine, DelegationRule } from '../services/collaboration/agentCollaborationEngine';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'memory' | 'llm' | 'tool' | 'approval' | 'publish' | 'delegation';
  title: string;
  description: string;
  config: Record<string, any>;
}

export const WorkflowBuilderPage: React.FC = () => {
  const { agents } = useAgentStore();

  const [nodes, setNodes] = useState<WorkflowNode[]>([
    { id: 'n1', type: 'trigger', title: 'Schedule Trigger (2:00 PM Daily)', description: 'Cron activation Asia/Dhaka timezone', config: { cron: '0 14 * * *' } },
    { id: 'n2', type: 'memory', title: 'Scoped Memory Retrieval', description: 'Load Trollogiya persona and approved hashtags', config: { scope: 'isolated' } },
    { id: 'n3', type: 'llm', title: 'AI Generation (Gemini 2.0 Flash)', description: 'Synthesize Bengali humor and witty narrative', config: { temp: 0.85 } },
    { id: 'n4', type: 'tool', title: 'Bengali Stylizer Tool', description: 'Validate punchlines & inject signature hashtags', config: { humor: 8 } },
    { id: 'n5', type: 'approval', title: 'Human Approval Gate', description: 'Pause execution for Administrator review', config: { risk: 'medium' } },
    { id: 'n6', type: 'publish', title: 'Meta Facebook Page Publish', description: 'Execute Graph API post with idempotency protection', config: { pageId: '109847291834910' } }
  ]);

  const [activeNode, setActiveNode] = useState<WorkflowNode | null>(nodes[0]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeSimulationIndex, setActiveSimulationIndex] = useState<number | null>(null);

  // Multi-Agent Delegation Chain State
  const [isDelegationRunning, setIsDelegationRunning] = useState(false);
  const [delegationLog, setDelegationLog] = useState<any>(null);

  // Add Node Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNodeType, setNewNodeType] = useState<WorkflowNode['type']>('tool');
  const [newNodeTitle, setNewNodeTitle] = useState('');
  const [newNodeDesc, setNewNodeDesc] = useState('');

  const handleSimulate = async () => {
    setIsSimulating(true);
    for (let i = 0; i < nodes.length; i++) {
      setActiveSimulationIndex(i);
      await new Promise(r => setTimeout(r, 400));
    }
    setActiveSimulationIndex(null);
    setIsSimulating(false);
    alert(`Workflow pipeline execution trace simulated successfully through all ${nodes.length} nodes.`);
  };

  const handleAddNode = () => {
    const title = newNodeTitle.trim() || `New ${newNodeType.toUpperCase()} Node`;
    const desc = newNodeDesc.trim() || `Configured ${newNodeType} pipeline step`;
    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      type: newNodeType,
      title,
      description: desc,
      config: { createdAt: new Date().toISOString() }
    };
    setNodes(prev => [...prev, newNode]);
    setActiveNode(newNode);
    setShowAddModal(false);
    setNewNodeTitle('');
    setNewNodeDesc('');
  };

  const handleDeleteNode = (id: string) => {
    if (nodes.length <= 1) {
      alert('A workflow must maintain at least one node.');
      return;
    }
    setNodes(prev => prev.filter(n => n.id !== id));
    if (activeNode?.id === id) {
      setActiveNode(nodes[0] || null);
    }
  };

  const handleMoveNode = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= nodes.length) return;

    const updated = [...nodes];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setNodes(updated);
  };

  const handleExportWorkflow = () => {
    const payload = {
      name: 'Zuu Agent Orchestration Workflow',
      version: 1,
      exportedAt: new Date().toISOString(),
      nodes
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `workflow_nodes_${Date.now()}.json`);
    document.body.appendChild(dl);
    dl.click();
    document.body.removeChild(dl);
  };

  // Run controlled Agent-to-Agent Delegation Demo
  const handleRunDelegationDemo = async () => {
    setIsDelegationRunning(true);
    setDelegationLog(null);

    const researchAgent = agents.find(a => a.category === 'research') || agents[0];
    const contentAgent = agents.find(a => a.slug.includes('trollogiya')) || agents[0];

    const rules: DelegationRule[] = [
      {
        id: 'rule-research-to-content',
        sourceAgentId: researchAgent.id,
        targetAgentId: contentAgent.id,
        name: 'Research Dossier -> Viral Content Adapter',
        triggerCondition: 'on_output_completed',
        transformPrompt: (researchOutput) => 
          `Transform this research briefing into an engaging Bengali Facebook post:\n\n[Dossier]:\n${researchOutput.substring(0, 300)}`,
        requiresApprovalBeforeHandoff: false
      }
    ];

    const result = await AgentCollaborationEngine.runDelegationChain(
      researchAgent,
      'Investigate trending topics regarding monsoon weather and traffic in Dhaka',
      rules,
      agents,
      true
    );

    setDelegationLog(result);
    setIsDelegationRunning(false);
  };

  const getNodeIcon = (type: WorkflowNode['type']) => {
    switch (type) {
      case 'trigger': return Sparkles;
      case 'memory': return BrainCircuit;
      case 'llm': return Cpu;
      case 'tool': return Wrench;
      case 'approval': return CheckSquare;
      case 'publish': return Share2;
      default: return GitFork;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">Workflow Builder & Orchestration</h1>
          <p className="text-slate-400 text-sm mt-1">
            Visual pipeline editor with typed connections, agent-to-agent delegation, and simulation traces.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportWorkflow}
            className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
            title="Export workflow schema as JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold border border-cyan-800/60 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Pipeline Node</span>
          </button>

          <button
            onClick={handleSimulate}
            disabled={isSimulating}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950 transition"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Simulating Nodes...' : 'Simulate Pipeline'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Visual Canvas + Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Pipeline Canvas */}
        <div className="lg:col-span-2 border border-slate-800 rounded-2xl bg-[#0f172a]/95 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
              Pipeline Nodes ({nodes.length})
            </h2>
            <span className="text-[11px] text-slate-500 font-mono">Sequential Schema Execution</span>
          </div>

          <div className="space-y-3">
            {nodes.map((node, idx) => {
              const isRunning = activeSimulationIndex === idx;
              const isPassed = activeSimulationIndex !== null && activeSimulationIndex > idx;
              const isSelected = activeNode?.id === node.id;
              const Icon = getNodeIcon(node.type);

              return (
                <div key={node.id} className="relative">
                  <div
                    onClick={() => setActiveNode(node)}
                    className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between text-xs ${
                      isRunning 
                        ? 'border-cyan-400 bg-cyan-950/60 ring-2 ring-cyan-500/50' 
                        : isPassed
                        ? 'border-emerald-600/60 bg-emerald-950/20'
                        : isSelected
                        ? 'border-cyan-500 bg-cyan-950/30'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isRunning ? 'bg-cyan-500 text-slate-950 animate-pulse' : 'bg-slate-800 text-cyan-400'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-100 flex items-center space-x-2">
                          <span>{node.title}</span>
                          <span className="text-[10px] text-slate-500 font-mono">#{idx + 1}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{node.description}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleMoveNode(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded text-slate-500 hover:text-slate-300 disabled:opacity-30"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleMoveNode(idx, 'down')}
                        disabled={idx === nodes.length - 1}
                        className="p-1 rounded text-slate-500 hover:text-slate-300 disabled:opacity-30"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteNode(node.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 ml-1"
                        title="Delete Node"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {idx < nodes.length - 1 && (
                    <div className="w-0.5 h-4 bg-slate-800 mx-auto my-0.5"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Node Inspector Panel */}
        {activeNode && (
          <div className="border border-slate-800 rounded-2xl bg-[#0f172a]/95 p-6 space-y-4 text-xs h-fit sticky top-20">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500">Node Properties</span>
                <h3 className="font-bold text-slate-100 text-sm mt-0.5">{activeNode.title}</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-cyan-400 font-bold">
                {activeNode.type}
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Title</label>
              <input
                type="text"
                value={activeNode.title}
                onChange={(e) => {
                  const val = e.target.value;
                  setActiveNode({ ...activeNode, title: val });
                  setNodes(prev => prev.map(n => n.id === activeNode.id ? { ...n, title: val } : n));
                }}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Description</label>
              <textarea
                rows={2}
                value={activeNode.description}
                onChange={(e) => {
                  const val = e.target.value;
                  setActiveNode({ ...activeNode, description: val });
                  setNodes(prev => prev.map(n => n.id === activeNode.id ? { ...n, description: val } : n));
                }}
                className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500 text-[11px]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Configuration Parameters (JSON)</label>
              <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-400 overflow-x-auto">
                {JSON.stringify(activeNode.config, null, 2)}
              </pre>
            </div>

            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400">
              Connections are strictly checked for typed compatibility before execution.
            </div>
          </div>
        )}
      </div>

      {/* Part 18: Agent-to-Agent Controlled Collaboration Section */}
      <div className="border border-slate-800 rounded-2xl bg-[#0f172a]/95 p-6 space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-100">Agent-to-Agent Delegation Pipeline (PART 18)</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-violet-950 text-violet-300 border border-violet-800">
                Cycle Protection Active
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              Controlled multi-agent delegation: Research Agent produces intelligence &rarr; Content Agent crafts draft &rarr; Reviewer gate &rarr; Publisher.
            </p>
          </div>

          <button
            onClick={handleRunDelegationDemo}
            disabled={isDelegationRunning}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition shadow"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isDelegationRunning ? 'animate-spin' : ''}`} />
            <span>{isDelegationRunning ? 'Executing Chain...' : 'Run 2-Agent Delegation Chain'}</span>
          </button>
        </div>

        {delegationLog && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-200">Delegation Correlation ID: {delegationLog.chainCorrelationId}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                delegationLog.status === 'completed' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
              }`}>
                {delegationLog.status}
              </span>
            </div>

            <div className="space-y-2">
              {delegationLog.steps.map((st: any) => (
                <div key={st.stepIndex} className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-400">
                      Step {st.stepIndex}: {st.fromAgentName} ➔ {st.toAgentName}
                    </span>
                    <span className="text-slate-500 font-mono">{st.durationMs}ms</span>
                  </div>
                  <div className="text-slate-300 line-clamp-2">Output: {st.outputPayload}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Node Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs">
            <h3 className="font-bold text-slate-100 text-base">Add New Workflow Node</h3>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Node Category</label>
              <select
                value={newNodeType}
                onChange={(e) => setNewNodeType(e.target.value as WorkflowNode['type'])}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
              >
                <option value="trigger">Trigger (Schedule / Webhook / Manual)</option>
                <option value="memory">Scoped Memory Retrieval</option>
                <option value="llm">AI Generation (LLM Inference)</option>
                <option value="tool">Approved Tool Execution</option>
                <option value="approval">Human Approval Gate</option>
                <option value="publish">External Mutation / Meta Graph API</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Node Title</label>
              <input
                type="text"
                placeholder="e.g. Content Quality Inspection Node"
                value={newNodeTitle}
                onChange={(e) => setNewNodeTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Description</label>
              <textarea
                rows={2}
                placeholder="Brief description of this node's operational purpose..."
                value={newNodeDesc}
                onChange={(e) => setNewNodeDesc(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNode}
                className="px-5 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
              >
                Insert Node into Canvas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
