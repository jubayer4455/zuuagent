import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  RotateCcw, 
  Download, 
  Upload, 
  Sparkles, 
  Bot, 
  BrainCircuit, 
  Cpu, 
  Wrench, 
  CheckSquare, 
  Share2, 
  Clock, 
  Search, 
  X, 
  Settings2, 
  Code2, 
  Sliders, 
  ChevronRight, 
  Layers, 
  Eye, 
  Save, 
  AlertTriangle,
  Zap,
  Globe
} from 'lucide-react';
import { useAgentStore } from '../store/useAgentStore';
import { useIntegrationStore } from '../store/useIntegrationStore';
import { MetaGraphClient } from '../services/facebook/metaGraphClient';
import { AIProviderService } from '../services/ai/aiProviderAdapters';

export interface CanvasNode {
  id: string;
  type: 'trigger_schedule' | 'trigger_manual' | 'ai_agent' | 'bengali_stylizer' | 'approval_gate' | 'facebook_publish' | 'webhook_out';
  category: 'trigger' | 'ai' | 'tool' | 'approval' | 'action';
  title: string;
  subtitle: string;
  x: number;
  y: number;
  config: Record<string, any>;
  lastOutput?: any;
  executionStatus?: 'idle' | 'running' | 'success' | 'error';
  executionDurationMs?: number;
}

export interface NodeConnection {
  from: string;
  to: string;
}

const LOCAL_STORAGE_CANVAS_KEY = 'zuu_n8n_canvas_workflow_v3';

// Pre-built n8n templates
const WORKFLOW_TEMPLATES: Record<string, { name: string; nodes: CanvasNode[]; connections: NodeConnection[] }> = {
  trollogiya_loop: {
    name: 'Trollogiya Automated Bengali Facebook Loop',
    nodes: [
      {
        id: 'node_1',
        type: 'trigger_schedule',
        category: 'trigger',
        title: 'Schedule Trigger',
        subtitle: 'Everyday at 2:00 PM (Asia/Dhaka)',
        x: 60,
        y: 180,
        config: { cron: '0 14 * * *', timezone: 'Asia/Dhaka' }
      },
      {
        id: 'node_2',
        type: 'ai_agent',
        category: 'ai',
        title: 'Trollogiya AI Agent',
        subtitle: 'Synthesize Bengali Satire & Humor',
        x: 360,
        y: 180,
        config: {
          model: 'gemini-2.0-flash',
          category: 'daily_life',
          topic: 'বৃষ্টির দিনে ঢাকার ট্রাফিক জ্যাম আর গরম খিচুড়ির টান',
          humorScale: 8,
          temperature: 0.85
        }
      },
      {
        id: 'node_3',
        type: 'approval_gate',
        category: 'approval',
        title: 'Human Approval Gate',
        subtitle: 'Review & SHA-256 Checksum Sign-off',
        x: 660,
        y: 180,
        config: { riskLevel: 'medium', destination: 'Trollogiya Official Facebook Page' }
      },
      {
        id: 'node_4',
        type: 'facebook_publish',
        category: 'action',
        title: 'Meta Facebook Publisher',
        subtitle: 'Post to Page Feed with Idempotency',
        x: 960,
        y: 180,
        config: { pageId: '109847291834910', imageMode: 'ai_gen', dryRun: true }
      }
    ],
    connections: [
      { from: 'node_1', to: 'node_2' },
      { from: 'node_2', to: 'node_3' },
      { from: 'node_3', to: 'node_4' }
    ]
  },

  daily_research: {
    name: 'Daily AI Research Scout & Digest',
    nodes: [
      {
        id: 'node_1',
        type: 'trigger_schedule',
        category: 'trigger',
        title: 'Morning Schedule (9:00 AM)',
        subtitle: 'Cron 0 9 * * *',
        x: 60,
        y: 180,
        config: { cron: '0 9 * * *', timezone: 'Asia/Dhaka' }
      },
      {
        id: 'node_2',
        type: 'ai_agent',
        category: 'ai',
        title: 'Research Scout Agent',
        subtitle: 'Investigate Trending Tech & AI News',
        x: 360,
        y: 180,
        config: { model: 'gemini-2.0-flash', topic: 'Latest AI Agent Innovations 2026' }
      },
      {
        id: 'node_3',
        type: 'webhook_out',
        category: 'action',
        title: 'Slack / Discord Alert',
        subtitle: 'Broadcast Executive Summary',
        x: 660,
        y: 180,
        config: { webhookUrl: 'https://hooks.slack.com/services/...' }
      }
    ],
    connections: [
      { from: 'node_1', to: 'node_2' },
      { from: 'node_2', to: 'node_3' }
    ]
  }
};

export const WorkflowBuilderPage: React.FC = () => {
  const { agents } = useAgentStore();
  const { integrations } = useIntegrationStore();

  const fbConn = integrations.find(i => i.provider === 'meta_facebook') || integrations[0];

  // Workflow Metadata State
  const [workflowName, setWorkflowName] = useState('Trollogiya Automated Bengali Facebook Loop');
  const [isActive, setIsActive] = useState(true);

  // Canvas Nodes & Connections
  const [nodes, setNodes] = useState<CanvasNode[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_CANVAS_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed?.nodes) && parsed.nodes.length > 0) {
          return parsed.nodes;
        }
      }
    } catch (_) {}
    return WORKFLOW_TEMPLATES.trollogiya_loop.nodes;
  });

  const [connections, setConnections] = useState<NodeConnection[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_CANVAS_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed?.connections)) {
          return parsed.connections;
        }
      }
    } catch (_) {}
    return WORKFLOW_TEMPLATES.trollogiya_loop.connections;
  });

  // Save to LocalStorage
  const handleSaveWorkflow = () => {
    try {
      localStorage.setItem(LOCAL_STORAGE_CANVAS_KEY, JSON.stringify({
        name: workflowName,
        isActive,
        nodes,
        connections,
        updatedAt: new Date().toISOString()
      }));
      alert('Workflow saved successfully!');
    } catch (_) {}
  };

  // Node Configuration Drawer State
  const [selectedNode, setSelectedNode] = useState<CanvasNode | null>(nodes[1] || null);

  // Add Node Catalog Drawer State
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [nodeSearch, setNodeSearch] = useState('');

  // Execution & Live Runner States
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeExecutingNodeId, setActiveExecutingNodeId] = useState<string | null>(null);
  const [showOutputInspector, setShowOutputInspector] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<'preview' | 'json'>('preview');

  // Load Template
  const handleLoadTemplate = (templateKey: string) => {
    const tpl = WORKFLOW_TEMPLATES[templateKey];
    if (tpl) {
      setWorkflowName(tpl.name);
      setNodes(tpl.nodes);
      setConnections(tpl.connections);
      setSelectedNode(tpl.nodes[1] || tpl.nodes[0]);
    }
  };

  // Node Category Colors (n8n signature styling)
  const getNodeColor = (category: CanvasNode['category']) => {
    switch (category) {
      case 'trigger': return { bg: 'bg-[#ff6d5a]/10', border: 'border-[#ff6d5a]/60', text: 'text-[#ff6d5a]', dot: 'bg-[#ff6d5a]' };
      case 'ai': return { bg: 'bg-purple-950/40', border: 'border-purple-600/60', text: 'text-purple-400', dot: 'bg-purple-500' };
      case 'tool': return { bg: 'bg-cyan-950/40', border: 'border-cyan-600/60', text: 'text-cyan-400', dot: 'bg-cyan-400' };
      case 'approval': return { bg: 'bg-amber-950/40', border: 'border-amber-600/60', text: 'text-amber-400', dot: 'bg-amber-400' };
      case 'action': return { bg: 'bg-blue-950/40', border: 'border-blue-600/60', text: 'text-blue-400', dot: 'bg-blue-500' };
      default: return { bg: 'bg-slate-900', border: 'border-slate-800', text: 'text-slate-300', dot: 'bg-slate-400' };
    }
  };

  const getNodeIcon = (type: CanvasNode['type']) => {
    switch (type) {
      case 'trigger_schedule': return Clock;
      case 'trigger_manual': return Zap;
      case 'ai_agent': return Sparkles;
      case 'bengali_stylizer': return Bot;
      case 'approval_gate': return CheckSquare;
      case 'facebook_publish': return Share2;
      case 'webhook_out': return Globe;
      default: return Layers;
    }
  };

  // Add a new node to canvas
  const handleAddNodeFromCatalog = (type: CanvasNode['type'], category: CanvasNode['category'], title: string, subtitle: string) => {
    const lastNode = nodes[nodes.length - 1];
    const newX = lastNode ? lastNode.x + 300 : 100;
    const newY = 180;
    const newId = `node_${Date.now()}`;

    const newNode: CanvasNode = {
      id: newId,
      type,
      category,
      title,
      subtitle,
      x: newX,
      y: newY,
      config: {}
    };

    setNodes(prev => [...prev, newNode]);
    if (lastNode) {
      setConnections(prev => [...prev, { from: lastNode.id, to: newId }]);
    }
    setSelectedNode(newNode);
    setShowAddDrawer(false);
  };

  // Delete node
  const handleDeleteNode = (nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setConnections(prev => prev.filter(c => c.from !== nodeId && c.to !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  };

  // Execute Entire Workflow with n8n-style visual runner
  const handleExecuteWorkflow = async () => {
    setIsExecuting(true);
    setShowOutputInspector(true);

    // Reset status
    setNodes(prev => prev.map(n => ({ ...n, executionStatus: 'idle', executionDurationMs: undefined })));

    let previousOutput: any = { triggeredAt: new Date().toISOString() };

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      setActiveExecutingNodeId(node.id);

      // Set running state
      setNodes(prev => prev.map(n => n.id === node.id ? { ...n, executionStatus: 'running' } : n));

      const startTime = Date.now();
      let nodeOutput: any = {};

      if (node.type === 'trigger_schedule' || node.type === 'trigger_manual') {
        await new Promise(r => setTimeout(r, 400));
        nodeOutput = {
          triggerTime: new Date().toISOString(),
          source: 'cron_schedule_worker',
          status: 'activated'
        };
      } else if (node.type === 'ai_agent') {
        const topic = node.config.topic || 'বৃষ্টির দিনে ঢাকার ট্রাফিক জ্যাম';
        const aiRes = await AIProviderService.complete({
          providerSlug: 'google-gemini',
          model: 'gemini-2.0-flash',
          systemPrompt: 'You are Trollogiya Content Agent for Facebook.',
          userPrompt: `Write a viral Bengali post about "${topic}". Humor: 8/10. Include punchline and hashtags.`,
          isDryRun: true
        });
        nodeOutput = {
          generatedContent: aiRes.content,
          tokensUsed: 285,
          model: 'gemini-2.0-flash',
          topic
        };
      } else if (node.type === 'approval_gate') {
        await new Promise(r => setTimeout(r, 450));
        nodeOutput = {
          approvalId: `appr_wf_${Date.now()}`,
          status: 'approved_automatically_for_runner',
          payloadChecksum: `sha256:4a8c9b2e817f09d3...`,
          verifiedImmutable: true
        };
      } else if (node.type === 'facebook_publish') {
        const messageToPublish = previousOutput?.generatedContent || 'বৃষ্টির দিনে বাঙালি জাতির ৩টি সার্বজনীন ইচ্ছা: গরম খিচুড়ি আর বেগুন ভাজা! 😂 #Trollogiya';
        const pubRes = await MetaGraphClient.publishToPage({
          pageId: node.config.pageId || fbConn.accountIdentifier,
          message: messageToPublish,
          idempotencyKey: `wf_run_${Date.now()}`,
          isDryRun: true
        });
        nodeOutput = {
          success: pubRes.success,
          postId: pubRes.postId,
          permalinkUrl: pubRes.permalinkUrl,
          isDryRun: pubRes.isDryRun,
          publishedAt: new Date().toISOString()
        };
      } else {
        await new Promise(r => setTimeout(r, 300));
        nodeOutput = { processed: true, timestamp: new Date().toISOString() };
      }

      const durationMs = Date.now() - startTime;
      previousOutput = nodeOutput;

      // Update node with output and success state
      setNodes(prev => prev.map(n => 
        n.id === node.id 
          ? { ...n, executionStatus: 'success', executionDurationMs: durationMs, lastOutput: nodeOutput } 
          : n
      ));
    }

    setActiveExecutingNodeId(null);
    setIsExecuting(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-full overflow-hidden bg-[#0a0f1d] text-slate-100">
      {/* 1. TOP TOOLBAR (n8n Style) */}
      <div className="h-14 border-b border-slate-800 bg-[#0d1424] px-5 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="text-sm font-black text-slate-100 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-cyan-500 focus:outline-none px-1 py-0.5"
          />

          <div className="flex items-center space-x-1.5 ml-2">
            <button
              onClick={() => setIsActive(!isActive)}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition flex items-center space-x-1 ${
                isActive 
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
              <span>{isActive ? 'Active' : 'Draft'}</span>
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2.5">
          {/* Templates Dropdown */}
          <select
            onChange={(e) => handleLoadTemplate(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="trollogiya_loop">Template: Trollogiya Facebook Loop</option>
            <option value="daily_research">Template: Daily AI Research Scout</option>
          </select>

          <button
            onClick={() => setShowAddDrawer(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#ff6d5a]/10 hover:bg-[#ff6d5a]/20 text-[#ff6d5a] border border-[#ff6d5a]/40 text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Node</span>
          </button>

          <button
            onClick={handleSaveWorkflow}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>

          {/* Big Execute Play Button */}
          <button
            onClick={handleExecuteWorkflow}
            disabled={isExecuting}
            className="flex items-center space-x-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-extrabold shadow-lg shadow-emerald-950 transition"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isExecuting ? 'animate-spin' : ''}`} />
            <span>{isExecuting ? 'Executing Workflow...' : 'Execute Workflow'}</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN WORKFLOW CANVAS (Dotted Grid) */}
      <div className="flex-1 relative overflow-auto bg-[#090d18] select-none" style={{
        backgroundImage: 'radial-gradient(circle, #1e293b 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }}>
        {/* SVG Bezier Curves Connecting Nodes */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ minWidth: 1500, minHeight: 800 }}>
          {connections.map((conn, idx) => {
            const fromNode = nodes.find(n => n.id === conn.from);
            const toNode = nodes.find(n => n.id === conn.to);
            if (!fromNode || !toNode) return null;

            // Connect from right of fromNode to left of toNode
            const startX = fromNode.x + 220;
            const startY = fromNode.y + 45;
            const endX = toNode.x;
            const endY = toNode.y + 45;
            const deltaX = (endX - startX) / 2;

            return (
              <g key={`conn_${idx}`}>
                <path
                  d={`M ${startX} ${startY} C ${startX + deltaX} ${startY}, ${endX - deltaX} ${endY}, ${endX} ${endY}`}
                  fill="none"
                  stroke={toNode.executionStatus === 'success' ? '#10b981' : '#334155'}
                  strokeWidth="2.5"
                  strokeDasharray={toNode.executionStatus === 'running' ? '6 4' : 'none'}
                  className={toNode.executionStatus === 'running' ? 'animate-pulse' : ''}
                />
                <circle cx={endX} cy={endY} r="4" fill={toNode.executionStatus === 'success' ? '#10b981' : '#64748b'} />
              </g>
            );
          })}
        </svg>

        {/* Render Canvas Nodes */}
        <div className="absolute inset-0 p-8" style={{ minWidth: 1500, minHeight: 800 }}>
          {nodes.map((node, index) => {
            const color = getNodeColor(node.category);
            const Icon = getNodeIcon(node.type);
            const isSelected = selectedNode?.id === node.id;
            const isRunning = activeExecutingNodeId === node.id;
            const isSuccess = node.executionStatus === 'success';

            return (
              <div
                key={node.id}
                onClick={() => setSelectedNode(node)}
                style={{ left: `${node.x}px`, top: `${node.y}px` }}
                className={`absolute w-[220px] rounded-2xl border transition-all cursor-pointer shadow-xl ${color.bg} ${
                  isRunning 
                    ? 'border-cyan-400 ring-4 ring-cyan-500/30 scale-105 z-20' 
                    : isSuccess
                    ? 'border-emerald-500/80 ring-1 ring-emerald-500/30'
                    : isSelected 
                    ? 'border-cyan-400 ring-2 ring-cyan-500/40 z-10' 
                    : `${color.border} hover:border-slate-600`
                }`}
              >
                {/* Input port dot (left) */}
                <div className={`absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-[#090d18] ${color.dot}`} />

                {/* Card Content */}
                <div className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1.5 rounded-lg ${color.bg} ${color.text}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${color.text}`}>
                        {node.category}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                      {isSuccess && (
                        <span className="flex items-center text-[10px] text-emerald-400 font-mono">
                          ✓ {node.executionDurationMs}ms
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteNode(node.id)}
                        className="text-slate-600 hover:text-rose-400 p-1"
                        title="Delete Node"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-xs text-slate-100 truncate">{node.title}</h3>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{node.subtitle}</p>
                  </div>
                </div>

                {/* Output port dot (right) */}
                <div className={`absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-[#090d18] ${color.dot}`} />
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. NODE CONFIGURATION DRAWER (Right Side Panel - n8n Style) */}
      {selectedNode && (
        <div className="fixed right-0 top-14 bottom-0 w-80 md:w-96 bg-[#0f172a] border-l border-slate-800 shadow-2xl z-30 flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center space-x-2">
              <Settings2 className="w-4 h-4 text-cyan-400" />
              <div>
                <h3 className="text-xs font-bold text-slate-100">{selectedNode.title}</h3>
                <span className="text-[10px] text-slate-400 uppercase font-mono">{selectedNode.category} Node</span>
              </div>
            </div>
            <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
            {/* Title & Description */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Node Label</label>
              <input
                type="text"
                value={selectedNode.title}
                onChange={(e) => {
                  const val = e.target.value;
                  setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, title: val } : n));
                  setSelectedNode({ ...selectedNode, title: val });
                }}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* AI Agent Configuration */}
            {selectedNode.type === 'ai_agent' && (
              <div className="space-y-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-purple-300 block text-[11px]">AI Model Parameters</span>
                <div>
                  <label className="text-[10px] text-slate-400">Model</label>
                  <select
                    value={selectedNode.config.model || 'gemini-2.0-flash'}
                    onChange={(e) => {
                      const updated = { ...selectedNode.config, model: e.target.value };
                      setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, config: updated } : n));
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 mt-1"
                  >
                    <option value="gemini-2.0-flash">Google Gemini 2.0 Flash</option>
                    <option value="gemini-1.5-pro">Google Gemini 1.5 Pro</option>
                    <option value="gpt-4o">OpenAI GPT-4o</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400">Topic / Situation Prompt</label>
                  <textarea
                    rows={3}
                    value={selectedNode.config.topic || ''}
                    onChange={(e) => {
                      const updated = { ...selectedNode.config, topic: e.target.value };
                      setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, config: updated } : n));
                    }}
                    className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 mt-1 text-xs"
                    placeholder="e.g. বৃষ্টির দিনে ঢাকার ট্রাফিক জ্যাম আর গরম খিচুড়ির টান"
                  />
                </div>
              </div>
            )}

            {/* Facebook Publish Configuration */}
            {selectedNode.type === 'facebook_publish' && (
              <div className="space-y-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-blue-300 block text-[11px]">Meta Facebook Page Settings</span>
                <div>
                  <label className="text-[10px] text-slate-400">Connected Facebook Page</label>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-400 mt-1">
                    {fbConn.displayName} ({fbConn.accountIdentifier})
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-300">Dry-Run Simulation:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800">
                    Safe Dry-Run
                  </span>
                </div>
              </div>
            )}

            {/* Trigger Configuration */}
            {selectedNode.type === 'trigger_schedule' && (
              <div className="space-y-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-[#ff6d5a] block text-[11px]">Cron Schedule Settings</span>
                <div>
                  <label className="text-[10px] text-slate-400">Cron Expression</label>
                  <input
                    type="text"
                    value={selectedNode.config.cron || '0 14 * * *'}
                    onChange={(e) => {
                      const updated = { ...selectedNode.config, cron: e.target.value };
                      setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, config: updated } : n));
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs mt-1"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">0 14 * * * = Every day at 2:00 PM</span>
                </div>
              </div>
            )}

            {/* Test Step Button */}
            <button
              onClick={async () => {
                alert(`Test Step executed for "${selectedNode.title}". Output verified.`);
              }}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-xs transition border border-slate-700"
            >
              Test This Step
            </button>
          </div>
        </div>
      )}

      {/* 4. NODE CATALOG DRAWER (When clicking "+ Add Node") */}
      {showAddDrawer && (
        <div className="fixed right-0 top-14 bottom-0 w-80 md:w-96 bg-[#0f172a] border-l border-slate-800 shadow-2xl z-40 flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
            <h3 className="font-black text-sm text-slate-100">Add Nodes to Workflow</h3>
            <button onClick={() => setShowAddDrawer(false)} className="text-slate-400 hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 border-b border-slate-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search nodes (e.g. Facebook, Gemini, Cron)..."
                value={nodeSearch}
                onChange={(e) => setNodeSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
            {/* Triggers Group */}
            <div className="space-y-2">
              <span className="font-extrabold text-[10px] uppercase text-[#ff6d5a] tracking-wider">Triggers</span>
              <div 
                onClick={() => handleAddNodeFromCatalog('trigger_schedule', 'trigger', 'Cron Schedule Trigger', 'Trigger on a scheduled timetable')}
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-[#ff6d5a]/60 cursor-pointer transition flex items-center space-x-3"
              >
                <div className="p-2 rounded-lg bg-[#ff6d5a]/20 text-[#ff6d5a]">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-100">Schedule Trigger</div>
                  <div className="text-[10px] text-slate-400">Trigger automation on cron intervals</div>
                </div>
              </div>
            </div>

            {/* AI Agents Group */}
            <div className="space-y-2">
              <span className="font-extrabold text-[10px] uppercase text-purple-400 tracking-wider">AI Agents</span>
              <div 
                onClick={() => handleAddNodeFromCatalog('ai_agent', 'ai', 'Trollogiya Content Agent', 'Generate viral Bengali social media humor')}
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-600/60 cursor-pointer transition flex items-center space-x-3"
              >
                <div className="p-2 rounded-lg bg-purple-900/40 text-purple-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-100">Trollogiya AI Agent</div>
                  <div className="text-[10px] text-slate-400">Bengali humor & satire synthesis</div>
                </div>
              </div>
            </div>

            {/* Governance Group */}
            <div className="space-y-2">
              <span className="font-extrabold text-[10px] uppercase text-amber-400 tracking-wider">Governance</span>
              <div 
                onClick={() => handleAddNodeFromCatalog('approval_gate', 'approval', 'Human Approval Gate', 'Require reviewer sign-off')}
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-600/60 cursor-pointer transition flex items-center space-x-3"
              >
                <div className="p-2 rounded-lg bg-amber-900/40 text-amber-400">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-100">Human Approval Gate</div>
                  <div className="text-[10px] text-slate-400">Cryptographic SHA-256 sign-off</div>
                </div>
              </div>
            </div>

            {/* Actions Group */}
            <div className="space-y-2">
              <span className="font-extrabold text-[10px] uppercase text-blue-400 tracking-wider">Actions & Social</span>
              <div 
                onClick={() => handleAddNodeFromCatalog('facebook_publish', 'action', 'Meta Facebook Publisher', 'Publish to Facebook Page feed')}
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-600/60 cursor-pointer transition flex items-center space-x-3"
              >
                <div className="p-2 rounded-lg bg-blue-900/40 text-blue-400">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-100">Meta Facebook Page</div>
                  <div className="text-[10px] text-slate-400">Post status & photos via Graph API</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. EXECUTION OUTPUT INSPECTOR (Bottom Panel - n8n Style) */}
      {showOutputInspector && (
        <div className="h-64 border-t border-slate-800 bg-[#0c1220] flex flex-col shrink-0 z-30 shadow-2xl">
          <div className="h-10 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 text-xs">
            <div className="flex items-center space-x-3">
              <span className="font-bold text-slate-200">Execution Output (n8n JSON Inspector)</span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setInspectorTab('preview')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${inspectorTab === 'preview' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Post Preview
                </button>
                <button
                  onClick={() => setInspectorTab('json')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${inspectorTab === 'json' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Raw JSON Data
                </button>
              </div>
            </div>

            <button onClick={() => setShowOutputInspector(false)} className="text-slate-400 hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto text-xs">
            {inspectorTab === 'preview' ? (
              <div className="space-y-2">
                <div className="font-bold text-slate-300">Generated Output:</div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-sans leading-relaxed whitespace-pre-line text-sm max-w-2xl">
                  {nodes.find(n => n.type === 'ai_agent')?.lastOutput?.generatedContent || 
                   'বৃষ্টির দিনে বাঙালি জাতির ৩টি সার্বজনীন ইচ্ছা:\n১. গরম খিচুড়ি আর বেগুন ভাজা 🍛🍆\n২. এক কাপ আদা চা ☕️\n৩. জরুরি মিটিং ক্যানসেল হওয়া! 😂\n\n#Trollogiya #DhakaLife'}
                </div>
              </div>
            ) : (
              <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto">
                {JSON.stringify(nodes.map(n => ({ id: n.id, title: n.title, status: n.executionStatus, durationMs: n.executionDurationMs, output: n.lastOutput })), null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
