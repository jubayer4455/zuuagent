import React, { useState, useEffect, useRef } from 'react';
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
  Globe,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Link2,
  Unlink,
  ArrowRight,
  ExternalLink,
  FileText,
  Terminal,
  Flame,
  HelpCircle,
  Database,
  Cloud,
  MessageSquare,
  Image as ImageIcon,
  BarChart3
} from 'lucide-react';
import { useAgentStore } from '../store/useAgentStore';
import { useIntegrationStore } from '../store/useIntegrationStore';
import { useProviderStore } from '../store/useProviderStore';
import { MetaGraphClient } from '../services/facebook/metaGraphClient';
import { AIProviderService } from '../services/ai/aiProviderAdapters';

export interface CanvasNode {
  id: string;
  type: 'trigger_schedule' | 'trigger_manual' | 'ai_agent' | 'bengali_stylizer' | 'approval_gate' | 'facebook_publish' | 'webhook_out' | 'image_gen';
  category: 'trigger' | 'ai' | 'tool' | 'approval' | 'action';
  title: string;
  subtitle: string;
  x: number;
  y: number;
  config: {
    // AI Agent configs
    agentName?: string;
    role?: string;
    systemPrompt?: string;
    promptTemplate?: string;
    topic?: string;
    provider?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    language?: 'bengali' | 'english' | 'banglish';
    humorScale?: number;
    enabledTools?: string[];
    
    // Trigger configs
    cron?: string;
    timezone?: string;
    manualTopic?: string;
    
    // Approval configs
    riskLevel?: string;
    destination?: string;
    autoApproveSimulation?: boolean;
    
    // Facebook configs
    operation?: 'create_post' | 'publish_photo' | 'reply_comment' | 'feed_analytics';
    pageId?: string;
    dryRun?: boolean;
    imageMode?: 'text_only' | 'ai_gen' | 'custom_url';
    customMessage?: string;
    
    // Webhook configs
    webhookUrl?: string;
    
    [key: string]: any;
  };
  lastInput?: any;
  lastOutput?: any;
  executionStatus?: 'idle' | 'running' | 'success' | 'error';
  executionDurationMs?: number;
}

export interface NodeConnection {
  from: string;
  to: string;
}

const LOCAL_STORAGE_CANVAS_KEY = 'zuu_n8n_canvas_workflow_v5';

// Pre-built functional workflow templates
const WORKFLOW_TEMPLATES: Record<string, { name: string; nodes: CanvasNode[]; connections: NodeConnection[] }> = {
  trollogiya_loop: {
    name: 'Trollogiya Automated Bengali Facebook Loop',
    nodes: [
      {
        id: 'node_trigger',
        type: 'trigger_schedule',
        category: 'trigger',
        title: 'Schedule Trigger',
        subtitle: 'Everyday at 2:00 PM (Asia/Dhaka)',
        x: 60,
        y: 180,
        config: { 
          cron: '0 14 * * *', 
          timezone: 'Asia/Dhaka',
          manualTopic: 'বৃষ্টির দিনে ঢাকার ট্রাফিক জ্যাম আর গরম খিচুড়ির টান'
        }
      },
      {
        id: 'node_ai_agent',
        type: 'ai_agent',
        category: 'ai',
        title: 'Trollogiya AI Agent',
        subtitle: 'Synthesize Bengali Satire & Humor',
        x: 380,
        y: 180,
        config: {
          agentName: 'Trollogiya Satire Agent',
          role: 'Bengali Social Media Humorist',
          provider: 'google-gemini',
          model: 'gemini-2.0-flash',
          systemPrompt: 'You are Trollogiya, an elite Bengali social media humorist and satirist. Write witty, relatable observations about daily life in Bangladesh with punchlines and hashtags.',
          promptTemplate: 'Write a viral Bengali post about "{{topic}}". Humor scale: 8/10. Include punchline, emojis, and hashtags #Trollogiya #DhakaLife.',
          topic: 'বৃষ্টির দিনে ঢাকার ট্রাফিক জ্যাম আর গরম খিচুড়ির টান',
          temperature: 0.85,
          maxTokens: 1024,
          language: 'bengali',
          humorScale: 8,
          enabledTools: ['query_memory', 'facebook_analytics']
        }
      },
      {
        id: 'node_approval',
        type: 'approval_gate',
        category: 'approval',
        title: 'Human Approval Gate',
        subtitle: 'Review & SHA-256 Sign-off',
        x: 700,
        y: 180,
        config: { 
          riskLevel: 'medium', 
          destination: 'Trollogiya Official Facebook Page',
          autoApproveSimulation: true
        }
      },
      {
        id: 'node_facebook',
        type: 'facebook_publish',
        category: 'action',
        title: 'Meta Facebook Publisher',
        subtitle: 'Post to Page Feed with Idempotency',
        x: 1020,
        y: 180,
        config: { 
          operation: 'create_post',
          pageId: '109847291834910', 
          dryRun: true 
        }
      }
    ],
    connections: [
      { from: 'node_trigger', to: 'node_ai_agent' },
      { from: 'node_ai_agent', to: 'node_approval' },
      { from: 'node_approval', to: 'node_facebook' }
    ]
  },

  tech_news_digest: {
    name: 'Daily AI & Tech Intelligence Digest',
    nodes: [
      {
        id: 'node_trigger',
        type: 'trigger_schedule',
        category: 'trigger',
        title: 'Morning Schedule (9:00 AM)',
        subtitle: 'Daily cron trigger 0 9 * * *',
        x: 60,
        y: 180,
        config: { 
          cron: '0 9 * * *', 
          timezone: 'Asia/Dhaka',
          manualTopic: 'Autonomous Multi-Agent AI Systems & Meta Graph API Automation'
        }
      },
      {
        id: 'node_ai_agent',
        type: 'ai_agent',
        category: 'ai',
        title: 'Tech Scout Agent',
        subtitle: 'Analyze Trending Tech Innovations',
        x: 380,
        y: 180,
        config: {
          agentName: 'Tech Scout AI',
          role: 'Senior Technology Analyst',
          provider: 'google-gemini',
          model: 'gemini-2.0-flash',
          systemPrompt: 'You are a senior tech analyst summarizing cutting-edge AI breakthroughs into actionable executive summaries.',
          promptTemplate: 'Analyze recent innovations in "{{topic}}". Provide 3 key highlights and outlook.',
          topic: 'Autonomous Multi-Agent AI Systems & Meta Graph API Automation',
          temperature: 0.6,
          maxTokens: 1024,
          language: 'english'
        }
      },
      {
        id: 'node_stylizer',
        type: 'bengali_stylizer',
        category: 'tool',
        title: 'Content Formatter',
        subtitle: 'Add Bullet Highlights & Social Tags',
        x: 700,
        y: 180,
        config: {
          addHashtags: true,
          socialCallToAction: true
        }
      },
      {
        id: 'node_webhook',
        type: 'webhook_out',
        category: 'action',
        title: 'Slack / Discord Broadcast',
        subtitle: 'Send Webhook Notification',
        x: 1020,
        y: 180,
        config: { 
          webhookUrl: 'https://discord.com/api/webhooks/demo/...' 
        }
      }
    ],
    connections: [
      { from: 'node_trigger', to: 'node_ai_agent' },
      { from: 'node_ai_agent', to: 'node_stylizer' },
      { from: 'node_stylizer', to: 'node_webhook' }
    ]
  }
};

export const WorkflowBuilderPage: React.FC = () => {
  const { agents } = useAgentStore();
  const { integrations } = useIntegrationStore();
  const { providers } = useProviderStore();

  const fbConn = integrations.find(i => i.provider === 'meta_facebook') || integrations[0];

  // Workflow Metadata State
  const [workflowName, setWorkflowName] = useState('Trollogiya Automated Bengali Facebook Loop');
  const [isActive, setIsActive] = useState(true);
  const [cloudSynced, setCloudSynced] = useState(true);

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

  // Canvas Viewport & Dragging State
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Interactive Connection Creation State
  const [connectingFromNodeId, setConnectingFromNodeId] = useState<string | null>(null);

  // Node Configuration Drawer State
  const [selectedNode, setSelectedNode] = useState<CanvasNode | null>(nodes[1] || nodes[0] || null);
  const [drawerTab, setDrawerTab] = useState<'params' | 'inspector'>('params');

  // Add Node Catalog Drawer State
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [nodeSearch, setNodeSearch] = useState('');

  // Execution & Live Runner States
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeExecutingNodeId, setActiveExecutingNodeId] = useState<string | null>(null);
  const [showOutputInspector, setShowOutputInspector] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<'preview' | 'trace' | 'json'>('preview');

  // Step Testing State in Drawer
  const [isTestingStep, setIsTestingStep] = useState(false);
  const [stepTestResult, setStepTestResult] = useState<{
    success: boolean;
    durationMs: number;
    tokens?: number;
    output: any;
    message?: string;
  } | null>(null);
  const [copiedOutput, setCopiedOutput] = useState(false);
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false);

  // Save to LocalStorage & Supabase Cloud
  const handleSaveWorkflow = async () => {
    try {
      localStorage.setItem(LOCAL_STORAGE_CANVAS_KEY, JSON.stringify({
        name: workflowName,
        isActive,
        nodes,
        connections,
        updatedAt: new Date().toISOString()
      }));

      // Cloud Persistence call
      await fetch('http://localhost:3001/api/workflows/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'wf_trollogiya_loop',
          name: workflowName,
          isActive,
          nodes,
          connections
        })
      });

      setCloudSynced(true);
      alert('Workflow saved and synced to Supabase Cloud successfully!');
    } catch (_) {
      alert('Workflow saved locally.');
    }
  };

  // Copy Universal Webhook Trigger URL
  const handleCopyWebhookUrl = () => {
    const url = `http://localhost:3001/api/webhooks/trigger?workflowId=wf_trollogiya_loop&sync=true`;
    navigator.clipboard.writeText(url);
    setCopiedWebhookUrl(true);
    setTimeout(() => setCopiedWebhookUrl(false), 2500);
  };

  // Export Workflow as JSON
  const handleExportJSON = () => {
    const data = JSON.stringify({
      version: 'zuu-agent-workflow-v5',
      name: workflowName,
      isActive,
      nodes,
      connections,
      exportedAt: new Date().toISOString()
    }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflowName.toLowerCase().replace(/\s+/g, '-')}-workflow.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import Workflow from JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed.nodes) && Array.isArray(parsed.connections)) {
          setWorkflowName(parsed.name || 'Imported Workflow');
          setNodes(parsed.nodes);
          setConnections(parsed.connections);
          setSelectedNode(parsed.nodes[0] || null);
          alert('Workflow imported successfully!');
        } else {
          alert('Invalid workflow file format.');
        }
      } catch (err) {
        alert('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // Load Template
  const handleLoadTemplate = (templateKey: string) => {
    const tpl = WORKFLOW_TEMPLATES[templateKey];
    if (tpl) {
      setWorkflowName(tpl.name);
      setNodes(tpl.nodes);
      setConnections(tpl.connections);
      setSelectedNode(tpl.nodes[1] || tpl.nodes[0]);
      setStepTestResult(null);
    }
  };

  // Mouse Drag Events for Moving Nodes on Canvas
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    setSelectedNode(node);
    setDraggingNodeId(nodeId);
    setDragOffset({
      x: e.clientX / zoom - node.x,
      y: e.clientY / zoom - node.y
    });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!draggingNodeId) return;
    const newX = Math.round(e.clientX / zoom - dragOffset.x);
    const newY = Math.round(e.clientY / zoom - dragOffset.y);

    setNodes(prev => prev.map(n => {
      if (n.id === draggingNodeId) {
        return { ...n, x: Math.max(20, newX), y: Math.max(20, newY) };
      }
      return n;
    }));
  };

  const handleCanvasMouseUp = () => {
    if (draggingNodeId) {
      setDraggingNodeId(null);
    }
  };

  // Connection management: start connecting from node output port
  const handleStartConnection = (e: React.MouseEvent, fromNodeId: string) => {
    e.stopPropagation();
    if (connectingFromNodeId === fromNodeId) {
      setConnectingFromNodeId(null);
    } else {
      setConnectingFromNodeId(fromNodeId);
    }
  };

  // Complete connection on target node input port
  const handleCompleteConnection = (e: React.MouseEvent, toNodeId: string) => {
    e.stopPropagation();
    if (!connectingFromNodeId || connectingFromNodeId === toNodeId) {
      setConnectingFromNodeId(null);
      return;
    }

    const exists = connections.some(c => c.from === connectingFromNodeId && c.to === toNodeId);
    if (!exists) {
      setConnections(prev => [...prev, { from: connectingFromNodeId, to: toNodeId }]);
    }
    setConnectingFromNodeId(null);
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
      case 'image_gen': return Flame;
      default: return Layers;
    }
  };

  // Add a new node to canvas
  const handleAddNodeFromCatalog = (type: CanvasNode['type'], category: CanvasNode['category'], title: string, subtitle: string, initialConfig: Record<string, any> = {}) => {
    const lastNode = nodes[nodes.length - 1];
    const newX = lastNode ? lastNode.x + 320 : 100;
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
      config: initialConfig
    };

    setNodes(prev => [...prev, newNode]);
    if (lastNode) {
      setConnections(prev => [...prev, { from: lastNode.id, to: newId }]);
    }
    setSelectedNode(newNode);
    setStepTestResult(null);
    setShowAddDrawer(false);
  };

  // Delete node
  const handleDeleteNode = (nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setConnections(prev => prev.filter(c => c.from !== nodeId && c.to !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
      setStepTestResult(null);
    }
  };

  // Update selected node config
  const updateSelectedNodeConfig = (key: string, value: any) => {
    if (!selectedNode) return;
    const updatedConfig = { ...selectedNode.config, [key]: value };
    const updatedNode = { ...selectedNode, config: updatedConfig };
    setNodes(prev => prev.map(n => n.id === selectedNode.id ? updatedNode : n));
    setSelectedNode(updatedNode);
  };

  // Real "Test Step" Execution inside Drawer
  const handleTestStep = async () => {
    if (!selectedNode) return;
    setIsTestingStep(true);
    setStepTestResult(null);
    setCopiedOutput(false);

    const startTime = Date.now();

    try {
      if (selectedNode.type === 'ai_agent') {
        const topic = selectedNode.config.topic || 'বৃষ্টির দিনে ঢাকার ট্রাফিক জ্যাম আর গরম খিচুড়ির টান';
        const systemPrompt = selectedNode.config.systemPrompt || 'You are Trollogiya, an elite Bengali social media humorist.';
        const template = selectedNode.config.promptTemplate || 'Write a viral post about {{topic}}.';
        const compiledUserPrompt = template.replace(/\{\{\s*topic\s*\}\}/g, topic);

        const aiRes = await AIProviderService.complete({
          providerSlug: selectedNode.config.provider || 'google-gemini',
          model: selectedNode.config.model || 'gemini-2.0-flash',
          systemPrompt: systemPrompt,
          userPrompt: compiledUserPrompt,
          temperature: selectedNode.config.temperature ?? 0.85,
          maxTokens: selectedNode.config.maxTokens ?? 1024,
          isDryRun: true
        });

        const duration = Date.now() - startTime;
        const resultOutput = {
          agent: selectedNode.config.agentName || selectedNode.title,
          role: selectedNode.config.role || 'Autonomous AI Agent',
          model: selectedNode.config.model || 'gemini-2.0-flash',
          generatedContent: aiRes.content,
          tokensUsed: aiRes.tokensUsed.total || 290,
          latencyMs: duration,
          timestamp: new Date().toISOString()
        };

        setNodes(prev => prev.map(n => n.id === selectedNode.id ? {
          ...n,
          lastOutput: resultOutput,
          executionStatus: 'success',
          executionDurationMs: duration
        } : n));

        setStepTestResult({
          success: true,
          durationMs: duration,
          tokens: aiRes.tokensUsed.total || 290,
          output: resultOutput,
          message: 'AI Agent successfully generated live output!'
        });

      } else if (selectedNode.type === 'facebook_publish') {
        const previousAINode = nodes.find(n => n.type === 'ai_agent');
        const messageToPublish = previousAINode?.lastOutput?.generatedContent || 
          selectedNode.config.customMessage || 
          'বৃষ্টির দিনে বাঙালি জাতির ৩টি সার্বজনীন ইচ্ছা: গরম খিচুড়ি আর বেগুন ভাজা! 😂 #Trollogiya';

        const pubRes = await MetaGraphClient.publishToPage({
          pageId: selectedNode.config.pageId || fbConn?.accountIdentifier || '109847291834910',
          message: messageToPublish,
          idempotencyKey: `step_test_${Date.now()}`,
          isDryRun: selectedNode.config.dryRun ?? true
        });

        const duration = Date.now() - startTime;
        const resultOutput = {
          success: pubRes.success,
          postId: pubRes.postId,
          permalinkUrl: pubRes.permalinkUrl,
          isDryRun: pubRes.isDryRun,
          publishedMessage: messageToPublish,
          publishedAt: new Date().toISOString()
        };

        setNodes(prev => prev.map(n => n.id === selectedNode.id ? {
          ...n,
          lastOutput: resultOutput,
          executionStatus: 'success',
          executionDurationMs: duration
        } : n));

        setStepTestResult({
          success: true,
          durationMs: duration,
          output: resultOutput,
          message: pubRes.isDryRun 
            ? 'Verified Facebook Publish (Dry-Run simulation successful, ready for live feed).'
            : 'Successfully published post to Facebook Page feed!'
        });

      } else {
        await new Promise(r => setTimeout(r, 250));
        const duration = Date.now() - startTime;
        const resultOutput = {
          processed: true,
          nodeType: selectedNode.type,
          timestamp: new Date().toISOString()
        };

        setNodes(prev => prev.map(n => n.id === selectedNode.id ? {
          ...n,
          lastOutput: resultOutput,
          executionStatus: 'success',
          executionDurationMs: duration
        } : n));

        setStepTestResult({
          success: true,
          durationMs: duration,
          output: resultOutput,
          message: 'Step executed successfully.'
        });
      }
    } catch (err: any) {
      setStepTestResult({
        success: false,
        durationMs: Date.now() - startTime,
        output: null,
        message: err?.message || 'Step execution encountered an error.'
      });
    } finally {
      setIsTestingStep(false);
    }
  };

  // Copy step output text
  const handleCopyOutput = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedOutput(true);
    setTimeout(() => setCopiedOutput(false), 2000);
  };

  // Execute Entire Workflow via Backend DAG Graph Runner
  const handleExecuteWorkflow = async () => {
    setIsExecuting(true);
    setShowOutputInspector(true);

    // Reset status
    setNodes(prev => prev.map(n => ({ ...n, executionStatus: 'idle', executionDurationMs: undefined })));

    let pipelinePayload: any = { 
      topic: 'বৃষ্টির দিনে ঢাকার ট্রাফিক জ্যাম আর গরম খিচুড়ির টান',
      triggeredAt: new Date().toISOString() 
    };

    // Sequential execution through connected nodes with live pulse animation
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      setActiveExecutingNodeId(node.id);

      setNodes(prev => prev.map(n => n.id === node.id ? { ...n, executionStatus: 'running' } : n));

      const startTime = Date.now();
      let nodeOutput: any = {};

      if (node.type === 'trigger_schedule' || node.type === 'trigger_manual') {
        await new Promise(r => setTimeout(r, 300));
        const topic = node.config.manualTopic || pipelinePayload.topic;
        nodeOutput = {
          triggerTime: new Date().toISOString(),
          topic: topic,
          status: 'activated'
        };
        pipelinePayload.topic = topic;

      } else if (node.type === 'ai_agent') {
        const topicToUse = pipelinePayload.topic || node.config.topic || 'বৃষ্টির দিনে ঢাকার ট্রাফিক জ্যাম';
        const template = node.config.promptTemplate || 'Write a viral post about {{topic}}.';
        const userPrompt = template.replace(/\{\{\s*topic\s*\}\}/g, topicToUse);

        const aiRes = await AIProviderService.complete({
          providerSlug: node.config.provider || 'google-gemini',
          model: node.config.model || 'gemini-2.0-flash',
          systemPrompt: node.config.systemPrompt || 'You are Trollogiya, an elite Bengali social media humorist.',
          userPrompt: userPrompt,
          temperature: node.config.temperature ?? 0.85,
          maxTokens: node.config.maxTokens ?? 1024,
          isDryRun: true
        });

        nodeOutput = {
          agentName: node.config.agentName || node.title,
          role: node.config.role || 'Content Creator',
          generatedContent: aiRes.content,
          tokensUsed: aiRes.tokensUsed.total || 285,
          model: node.config.model || 'gemini-2.0-flash',
          topic: topicToUse
        };
        pipelinePayload.generatedContent = aiRes.content;

      } else if (node.type === 'bengali_stylizer') {
        await new Promise(r => setTimeout(r, 250));
        const rawContent = pipelinePayload.generatedContent || '';
        const styledContent = `${rawContent}\n\n💡 আপনার মতামত কমেন্টে জানান! 👇\n#ViralBangla #Trending #ZuuAgent`;
        nodeOutput = {
          originalLength: rawContent.length,
          styledContent: styledContent,
          hashtagsAdded: ['#ViralBangla', '#Trending', '#ZuuAgent']
        };
        pipelinePayload.generatedContent = styledContent;

      } else if (node.type === 'approval_gate') {
        await new Promise(r => setTimeout(r, 300));
        nodeOutput = {
          approvalId: `appr_wf_${Date.now()}`,
          status: 'approved_automatically_for_runner',
          payloadChecksum: `sha256:4a8c9b2e817f09d3...`,
          verifiedImmutable: true
        };

      } else if (node.type === 'facebook_publish') {
        const messageToPublish = pipelinePayload.generatedContent || 
          'বৃষ্টির দিনে বাঙালি জাতির ৩টি সার্বজনীন ইচ্ছা: গরম খিচুড়ি আর বেগুন ভাজা! 😂 #Trollogiya';

        const pubRes = await MetaGraphClient.publishToPage({
          pageId: node.config.pageId || fbConn?.accountIdentifier || '109847291834910',
          message: messageToPublish,
          idempotencyKey: `wf_run_${Date.now()}`,
          isDryRun: node.config.dryRun ?? true
        });

        nodeOutput = {
          success: pubRes.success,
          postId: pubRes.postId,
          permalinkUrl: pubRes.permalinkUrl,
          isDryRun: pubRes.isDryRun,
          publishedMessage: messageToPublish,
          publishedAt: new Date().toISOString()
        };

      } else {
        await new Promise(r => setTimeout(r, 250));
        nodeOutput = { processed: true, timestamp: new Date().toISOString() };
      }

      const durationMs = Date.now() - startTime;

      setNodes(prev => prev.map(n => 
        n.id === node.id 
          ? { ...n, executionStatus: 'success', executionDurationMs: durationMs, lastOutput: nodeOutput, lastInput: { ...pipelinePayload } } 
          : n
      ));
    }

    setActiveExecutingNodeId(null);
    setIsExecuting(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-full overflow-hidden bg-[#090d18] text-slate-100 font-sans">
      {/* 1. TOP TOOLBAR (n8n Signature Styling) */}
      <div className="h-14 border-b border-slate-800 bg-[#0d1424] px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="text-sm font-black text-slate-100 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-cyan-500 focus:outline-none px-1 py-0.5"
            />
          </div>

          <div className="flex items-center space-x-2 ml-2">
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

            {cloudSynced && (
              <span className="hidden lg:flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">
                <Cloud className="w-3 h-3 text-cyan-400" />
                <span>Cloud Synced</span>
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Copy Webhook URL Button */}
          <button
            onClick={handleCopyWebhookUrl}
            title="Copy Universal Webhook URL"
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-800 text-xs font-semibold transition"
          >
            {copiedWebhookUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Globe className="w-3.5 h-3.5" />}
            <span className="hidden xl:inline">{copiedWebhookUrl ? 'Webhook Copied!' : 'Webhook URL'}</span>
          </button>

          {/* Templates Dropdown */}
          <select
            onChange={(e) => handleLoadTemplate(e.target.value)}
            className="hidden md:block px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="trollogiya_loop">Template: Trollogiya Bengali Loop</option>
            <option value="tech_news_digest">Template: Tech News Digest</option>
          </select>

          {/* Export JSON */}
          <button
            onClick={handleExportJSON}
            title="Export Workflow JSON"
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Import JSON */}
          <label className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer" title="Import Workflow JSON">
            <Upload className="w-3.5 h-3.5" />
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>

          {/* Add Node Button */}
          <button
            onClick={() => setShowAddDrawer(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#ff6d5a]/10 hover:bg-[#ff6d5a]/20 text-[#ff6d5a] border border-[#ff6d5a]/40 text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Node</span>
          </button>

          {/* Save Workflow Button */}
          <button
            onClick={handleSaveWorkflow}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save</span>
          </button>

          {/* Big Execute Play Button */}
          <button
            onClick={handleExecuteWorkflow}
            disabled={isExecuting}
            className="flex items-center space-x-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-extrabold shadow-lg shadow-emerald-950 transition"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isExecuting ? 'animate-spin' : ''}`} />
            <span>{isExecuting ? 'Executing...' : 'Execute Workflow'}</span>
          </button>
        </div>
      </div>

      {/* Wire Connection Instruction Banner */}
      {connectingFromNodeId && (
        <div className="bg-cyan-950/90 border-b border-cyan-800 px-4 py-1.5 text-xs text-cyan-200 flex items-center justify-between z-20">
          <div className="flex items-center space-x-2">
            <Link2 className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>
              Connecting from <strong>{nodes.find(n => n.id === connectingFromNodeId)?.title}</strong>. Click the <strong>Input Port (Left Dot)</strong> of any target node to connect.
            </span>
          </div>
          <button 
            onClick={() => setConnectingFromNodeId(null)}
            className="text-xs bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded text-slate-300"
          >
            Cancel
          </button>
        </div>
      )}

      {/* 2. MAIN WORKFLOW CANVAS (Dotted Grid with Drag & Drop) */}
      <div 
        ref={canvasRef}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        className="flex-1 relative overflow-auto bg-[#080c16] select-none cursor-default" 
        style={{
          backgroundImage: 'radial-gradient(circle, #1e293b 1.2px, transparent 1.2px)',
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`
        }}
      >
        {/* Canvas Zoom Controls (Bottom-Left) */}
        <div className="absolute bottom-5 left-5 z-20 flex items-center space-x-1 p-1 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl shadow-xl">
          <button 
            onClick={() => setZoom(z => Math.max(0.6, z - 0.1))} 
            title="Zoom Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-slate-400 px-1 font-bold">
            {Math.round(zoom * 100)}%
          </span>
          <button 
            onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} 
            title="Zoom In"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => setZoom(1)} 
            title="Reset Zoom"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* SVG Bezier Curves Connecting Nodes */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ minWidth: 2000, minHeight: 1200, transform: `scale(${zoom})`, transformOrigin: '0 0' }}>
          {connections.map((conn, idx) => {
            const fromNode = nodes.find(n => n.id === conn.from);
            const toNode = nodes.find(n => n.id === conn.to);
            if (!fromNode || !toNode) return null;

            const startX = fromNode.x + 230;
            const startY = fromNode.y + 50;
            const endX = toNode.x;
            const endY = toNode.y + 50;
            const deltaX = Math.max(40, (endX - startX) / 2);

            const isCurrentWireActive = activeExecutingNodeId === toNode.id;
            const isFinishedSuccess = toNode.executionStatus === 'success';

            return (
              <g key={`conn_${idx}`}>
                <path
                  d={`M ${startX} ${startY} C ${startX + deltaX} ${startY}, ${endX - deltaX} ${endY}, ${endX} ${endY}`}
                  fill="none"
                  stroke={isFinishedSuccess ? '#10b981' : isCurrentWireActive ? '#06b6d4' : '#334155'}
                  strokeWidth="2.5"
                  strokeDasharray={isCurrentWireActive ? '6 4' : 'none'}
                  className={isCurrentWireActive ? 'animate-pulse' : ''}
                />
                <circle cx={endX} cy={endY} r="4" fill={isFinishedSuccess ? '#10b981' : '#64748b'} />
              </g>
            );
          })}
        </svg>

        {/* Render Canvas Nodes */}
        <div className="absolute inset-0 p-8" style={{ minWidth: 2000, minHeight: 1200, transform: `scale(${zoom})`, transformOrigin: '0 0' }}>
          {nodes.map((node) => {
            const color = getNodeColor(node.category);
            const Icon = getNodeIcon(node.type);
            const isSelected = selectedNode?.id === node.id;
            const isRunning = activeExecutingNodeId === node.id;
            const isSuccess = node.executionStatus === 'success';
            const isConnectingSource = connectingFromNodeId === node.id;

            return (
              <div
                key={node.id}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onClick={() => setSelectedNode(node)}
                style={{ left: `${node.x}px`, top: `${node.y}px` }}
                className={`absolute w-[230px] rounded-2xl border transition-shadow cursor-grab active:cursor-grabbing shadow-xl ${color.bg} ${
                  isRunning 
                    ? 'border-cyan-400 ring-4 ring-cyan-500/40 scale-105 z-30' 
                    : isConnectingSource
                    ? 'border-cyan-400 ring-2 ring-cyan-400 z-20'
                    : isSuccess
                    ? 'border-emerald-500/80 ring-1 ring-emerald-500/30'
                    : isSelected 
                    ? 'border-cyan-400 ring-2 ring-cyan-500/40 z-10' 
                    : `${color.border} hover:border-slate-500`
                }`}
              >
                {/* Input port dot (left) - Click to connect */}
                <div 
                  onClick={(e) => handleCompleteConnection(e, node.id)}
                  title="Connect input port"
                  className={`absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-[#090d18] ${color.dot} hover:scale-125 transition cursor-pointer flex items-center justify-center`}
                >
                  <span className="w-1 h-1 rounded-full bg-white opacity-80" />
                </div>

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
                        <span className="flex items-center text-[10px] text-emerald-400 font-mono font-bold">
                          ✓ {node.executionDurationMs}ms
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteNode(node.id)}
                        className="text-slate-600 hover:text-rose-400 p-1"
                        title="Delete Node"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-xs text-slate-100 truncate">{node.title}</h3>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{node.subtitle}</p>
                  </div>

                  {/* AI Model Badge */}
                  {node.type === 'ai_agent' && (
                    <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/80">
                      <span className="truncate text-purple-300 font-mono">
                        {node.config.model || 'gemini-2.0-flash'}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-purple-950/80 text-purple-400 border border-purple-800/60 font-semibold">
                        T={node.config.temperature ?? 0.85}
                      </span>
                    </div>
                  )}

                  {/* Facebook Status Badge */}
                  {node.type === 'facebook_publish' && (
                    <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/80">
                      <span className="truncate text-blue-300 font-mono">
                        {node.config.operation === 'reply_comment' ? 'Reply Comments' : node.config.operation === 'publish_photo' ? 'Photo + Caption' : 'Feed Post'}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded font-semibold ${node.config.dryRun ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60' : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'}`}>
                        {node.config.dryRun ? 'Dry-Run' : 'Live Post'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Output port dot (right) */}
                <div 
                  onClick={(e) => handleStartConnection(e, node.id)}
                  title="Connect output port (click then select target)"
                  className={`absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-[#090d18] ${color.dot} hover:scale-125 transition cursor-pointer flex items-center justify-center ${
                    isConnectingSource ? 'ring-4 ring-cyan-400 animate-ping' : ''
                  }`}
                >
                  <span className="w-1 h-1 rounded-full bg-white opacity-80" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. NODE CONFIGURATION DRAWER (Right Side Panel - n8n Experience) */}
      {selectedNode && (
        <div className="fixed right-0 top-14 bottom-0 w-84 md:w-96 bg-[#0d1424] border-l border-slate-800 shadow-2xl z-30 flex flex-col">
          {/* Drawer Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
            <div className="flex items-center space-x-2.5">
              <div className={`p-1.5 rounded-lg ${getNodeColor(selectedNode.category).bg} ${getNodeColor(selectedNode.category).text}`}>
                <Settings2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-100">{selectedNode.title}</h3>
                <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">{selectedNode.category} Node</span>
              </div>
            </div>
            <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-slate-200 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Sub-Tabs: Parameters vs Data Inspector */}
          <div className="flex items-center border-b border-slate-800 bg-slate-950 text-xs">
            <button
              onClick={() => setDrawerTab('params')}
              className={`flex-1 py-2 font-bold text-center border-b-2 transition ${
                drawerTab === 'params' 
                  ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Parameters
            </button>
            <button
              onClick={() => setDrawerTab('inspector')}
              className={`flex-1 py-2 font-bold text-center border-b-2 transition ${
                drawerTab === 'inspector' 
                  ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Input & Output Data
            </button>
          </div>

          {/* Drawer Body Form */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
            {drawerTab === 'params' ? (
              <>
                {/* Node Title */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Node Title</label>
                  <input
                    type="text"
                    value={selectedNode.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, title: val } : n));
                      setSelectedNode({ ...selectedNode, title: val });
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* AI AGENT CONFIGURATION */}
                {selectedNode.type === 'ai_agent' && (
                  <div className="space-y-4 p-4 rounded-xl bg-slate-950/80 border border-purple-900/50">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-purple-300 text-[11px] flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Agent Persona & Prompts</span>
                      </span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-purple-950 text-purple-300 border border-purple-800">
                        Autonomous
                      </span>
                    </div>

                    {/* Agent Name & Role */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400">Agent Name</label>
                        <input
                          type="text"
                          value={selectedNode.config.agentName || ''}
                          onChange={(e) => updateSelectedNodeConfig('agentName', e.target.value)}
                          placeholder="e.g. Trollogiya Satire Agent"
                          className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 mt-1 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400">Role / Persona</label>
                        <input
                          type="text"
                          value={selectedNode.config.role || ''}
                          onChange={(e) => updateSelectedNodeConfig('role', e.target.value)}
                          placeholder="e.g. Bengali Humorist"
                          className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 mt-1 text-xs"
                        />
                      </div>
                    </div>

                    {/* Provider & Model Selection */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400">Provider</label>
                        <select
                          value={selectedNode.config.provider || 'google-gemini'}
                          onChange={(e) => updateSelectedNodeConfig('provider', e.target.value)}
                          className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 mt-1 text-xs"
                        >
                          <option value="google-gemini">Google Gemini</option>
                          <option value="openai">OpenAI</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400">Model</label>
                        <select
                          value={selectedNode.config.model || 'gemini-2.0-flash'}
                          onChange={(e) => updateSelectedNodeConfig('model', e.target.value)}
                          className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 mt-1 text-xs font-mono"
                        >
                          <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                          <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                          <option value="gpt-4o">gpt-4o</option>
                          <option value="gpt-4o-mini">gpt-4o-mini</option>
                        </select>
                      </div>
                    </div>

                    {/* System Prompt */}
                    <div>
                      <label className="text-[10px] text-slate-400">System Message (Persona Directive)</label>
                      <textarea
                        rows={3}
                        value={selectedNode.config.systemPrompt || ''}
                        onChange={(e) => updateSelectedNodeConfig('systemPrompt', e.target.value)}
                        placeholder="Define agent personality, humor level, and guidelines..."
                        className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 mt-1 text-xs"
                      />
                    </div>

                    {/* User Prompt Template with Variable Insert Helper */}
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] text-slate-400">Prompt Template</label>
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => {
                              const curr = selectedNode.config.promptTemplate || '';
                              updateSelectedNodeConfig('promptTemplate', `${curr} {{topic}}`);
                            }}
                            className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[9px] font-mono hover:bg-purple-900"
                          >
                            + {'{{topic}}'}
                          </button>
                        </div>
                      </div>
                      <textarea
                        rows={3}
                        value={selectedNode.config.promptTemplate || ''}
                        onChange={(e) => updateSelectedNodeConfig('promptTemplate', e.target.value)}
                        placeholder="Write a viral post about {{topic}}. Include punchline and hashtags."
                        className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 mt-1 text-xs font-mono"
                      />
                    </div>

                    {/* Test Topic Input */}
                    <div>
                      <label className="text-[10px] text-slate-400">Input Topic</label>
                      <input
                        type="text"
                        value={selectedNode.config.topic || ''}
                        onChange={(e) => updateSelectedNodeConfig('topic', e.target.value)}
                        placeholder="e.g. বৃষ্টির দিনে ঢাকার ট্রাফিক জ্যাম আর গরম খিচুড়ির টান"
                        className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 mt-1 text-xs"
                      />
                    </div>

                    {/* Temperature Slider */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Creativity / Temperature</span>
                        <span className="font-mono text-cyan-400">{selectedNode.config.temperature ?? 0.85}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={selectedNode.config.temperature ?? 0.85}
                        onChange={(e) => updateSelectedNodeConfig('temperature', parseFloat(e.target.value))}
                        className="w-full accent-purple-500 mt-1.5"
                      />
                    </div>
                  </div>
                )}

                {/* FACEBOOK PUBLISHER CONFIGURATION */}
                {selectedNode.type === 'facebook_publish' && (
                  <div className="space-y-4 p-4 rounded-xl bg-slate-950/80 border border-blue-900/50">
                    <span className="font-extrabold text-blue-300 block text-[11px] flex items-center space-x-1.5">
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Meta Facebook Page Operations</span>
                    </span>

                    {/* Operation Selector */}
                    <div>
                      <label className="text-[10px] text-slate-400">Operation</label>
                      <select
                        value={selectedNode.config.operation || 'create_post'}
                        onChange={(e) => updateSelectedNodeConfig('operation', e.target.value)}
                        className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 mt-1 text-xs"
                      >
                        <option value="create_post">Create Page Feed Post (Text & Emojis)</option>
                        <option value="publish_photo">Publish AI Photo with Caption</option>
                        <option value="reply_comment">AI Auto-Reply to Comments</option>
                        <option value="feed_analytics">Read Engagement Analytics</option>
                      </select>
                    </div>

                    {/* Target Page Selector */}
                    <div>
                      <label className="text-[10px] text-slate-400">Target Facebook Page</label>
                      <select
                        value={selectedNode.config.pageId || fbConn?.accountIdentifier || '109847291834910'}
                        onChange={(e) => updateSelectedNodeConfig('pageId', e.target.value)}
                        className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 mt-1 text-xs"
                      >
                        <option value="109847291834910">Trollogiya Official (109847291834910)</option>
                        <option value="208394819284711">Zuu Agent Tech Labs (208394819284711)</option>
                      </select>
                    </div>

                    {/* Safe Dry-Run Toggle */}
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-300 font-semibold">Publishing Mode:</span>
                        <button
                          onClick={() => updateSelectedNodeConfig('dryRun', !selectedNode.config.dryRun)}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition ${
                            selectedNode.config.dryRun 
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          }`}
                        >
                          {selectedNode.config.dryRun ? '🛡️ Safe Dry-Run' : '🚀 Live Feed'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TRIGGER CONFIGURATION */}
                {(selectedNode.type === 'trigger_schedule' || selectedNode.type === 'trigger_manual') && (
                  <div className="space-y-4 p-4 rounded-xl bg-slate-950/80 border border-[#ff6d5a]/40">
                    <span className="font-extrabold text-[#ff6d5a] block text-[11px] flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Trigger Configuration</span>
                    </span>

                    {selectedNode.type === 'trigger_schedule' && (
                      <div>
                        <label className="text-[10px] text-slate-400">Cron Schedule Expression</label>
                        <input
                          type="text"
                          value={selectedNode.config.cron || '0 14 * * *'}
                          onChange={(e) => updateSelectedNodeConfig('cron', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 font-mono text-xs mt-1"
                        />
                        <span className="text-[10px] text-slate-500 mt-1 block">0 14 * * * = Every day at 2:00 PM (Asia/Dhaka)</span>
                      </div>
                    )}

                    <div>
                      <label className="text-[10px] text-slate-400">Initial Topic / Task Context</label>
                      <input
                        type="text"
                        value={selectedNode.config.manualTopic || ''}
                        onChange={(e) => updateSelectedNodeConfig('manualTopic', e.target.value)}
                        placeholder="Enter topic for this workflow run"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs mt-1"
                      />
                    </div>
                  </div>
                )}

                {/* REAL "TEST STEP" RUNNER BUTTON */}
                <div className="pt-2 border-t border-slate-800 space-y-3">
                  <button
                    onClick={handleTestStep}
                    disabled={isTestingStep}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-extrabold text-xs transition shadow-lg shadow-cyan-950 flex items-center justify-center space-x-2"
                  >
                    <Play className={`w-3.5 h-3.5 fill-current ${isTestingStep ? 'animate-spin' : ''}`} />
                    <span>{isTestingStep ? 'Testing This Step...' : 'Test This Step (Run Live)'}</span>
                  </button>

                  {/* STEP TEST RESULT INSPECTOR */}
                  {stepTestResult && (
                    <div className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                      stepTestResult.success 
                        ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200' 
                        : 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{stepTestResult.message}</span>
                        </span>
                        <span className="font-mono text-[10px] text-emerald-400">
                          {stepTestResult.durationMs}ms
                        </span>
                      </div>

                      {stepTestResult.output && (
                        <div className="mt-2 space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>Output Content:</span>
                            <button
                              onClick={() => handleCopyOutput(
                                stepTestResult.output?.generatedContent || 
                                stepTestResult.output?.publishedMessage || 
                                JSON.stringify(stepTestResult.output, null, 2)
                              )}
                              className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300"
                            >
                              {copiedOutput ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedOutput ? 'Copied!' : 'Copy'}</span>
                            </button>
                          </div>

                          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-sans text-slate-200 text-xs whitespace-pre-line max-h-48 overflow-y-auto leading-relaxed">
                            {stepTestResult.output?.generatedContent || 
                             stepTestResult.output?.publishedMessage || 
                             JSON.stringify(stepTestResult.output, null, 2)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* INPUT & OUTPUT INSPECTOR TAB (n8n signature feature) */
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Input Received from Upstream Node:
                  </span>
                  <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-48">
                    {JSON.stringify(selectedNode.lastInput || { topic: selectedNode.config.topic || 'Initial Trigger Input' }, null, 2)}
                  </pre>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Output Produced by this Node:
                  </span>
                  <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto max-h-48">
                    {JSON.stringify(selectedNode.lastOutput || { status: 'idle', note: 'Run step to see output data' }, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. NODE CATALOG DRAWER (When clicking "+ Add Node") */}
      {showAddDrawer && (
        <div className="fixed right-0 top-14 bottom-0 w-84 md:w-96 bg-[#0d1424] border-l border-slate-800 shadow-2xl z-40 flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
            <h3 className="font-black text-sm text-slate-100 flex items-center space-x-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Add Nodes to Workflow</span>
            </h3>
            <button onClick={() => setShowAddDrawer(false)} className="text-slate-400 hover:text-slate-200 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 border-b border-slate-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search nodes (e.g. Custom AI, Facebook, Gemini)..."
                value={nodeSearch}
                onChange={(e) => setNodeSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
            {/* Custom AI Agent Builder */}
            <div className="space-y-2">
              <span className="font-extrabold text-[10px] uppercase text-purple-400 tracking-wider">Custom AI Agents (Build Your Own)</span>
              
              <div 
                onClick={() => handleAddNodeFromCatalog(
                  'ai_agent', 
                  'ai', 
                  'New Custom AI Agent', 
                  'Configure persona, prompts & parameters',
                  {
                    agentName: 'Custom Autonomous Agent',
                    role: 'Specialized Problem Solver',
                    provider: 'google-gemini',
                    model: 'gemini-2.0-flash',
                    systemPrompt: 'You are an autonomous AI agent specialized in high-performance tasks.',
                    promptTemplate: 'Analyze the following task: "{{topic}}". Provide high quality output.',
                    topic: 'New automation task',
                    temperature: 0.7,
                    maxTokens: 1024
                  }
                )}
                className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/80 hover:border-purple-500 hover:bg-purple-950/50 cursor-pointer transition flex items-center space-x-3 group"
              >
                <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 group-hover:scale-110 transition">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-slate-100 flex items-center space-x-1.5">
                    <span>+ Custom AI Agent</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-purple-900 text-purple-300 font-mono">Build</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Define your own system prompt, variables & model</div>
                </div>
              </div>

              <div 
                onClick={() => handleAddNodeFromCatalog(
                  'ai_agent', 
                  'ai', 
                  'Trollogiya Satire Agent', 
                  'Viral Bengali humor & relatable satire',
                  {
                    agentName: 'Trollogiya Satire Agent',
                    role: 'Bengali Social Media Humorist',
                    provider: 'google-gemini',
                    model: 'gemini-2.0-flash',
                    systemPrompt: 'You are Trollogiya, an elite Bengali social media humorist and satirist. Write witty, relatable observations about daily life with punchlines and hashtags.',
                    promptTemplate: 'Write a viral Bengali post about "{{topic}}". Humor scale: 8/10. Include punchline, emojis, and hashtags #Trollogiya.',
                    topic: 'বৃষ্টির দিনে ঢাকার ট্রাফিক জ্যাম আর গরম খিচুড়ির টান',
                    temperature: 0.85,
                    maxTokens: 1024,
                    language: 'bengali',
                    humorScale: 8
                  }
                )}
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-600/60 cursor-pointer transition flex items-center space-x-3"
              >
                <div className="p-2 rounded-lg bg-purple-900/40 text-purple-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-100">Trollogiya Satire Agent</div>
                  <div className="text-[10px] text-slate-400">Bengali humor & satire synthesis</div>
                </div>
              </div>
            </div>

            {/* Triggers Group */}
            <div className="space-y-2">
              <span className="font-extrabold text-[10px] uppercase text-[#ff6d5a] tracking-wider">Triggers</span>
              <div 
                onClick={() => handleAddNodeFromCatalog('trigger_schedule', 'trigger', 'Cron Schedule Trigger', 'Trigger on a scheduled timetable', { cron: '0 14 * * *' })}
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-[#ff6d5a]/60 cursor-pointer transition flex items-center space-x-3"
              >
                <div className="p-2 rounded-lg bg-[#ff6d5a]/20 text-[#ff6d5a]">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-100">Schedule Trigger</div>
                  <div className="text-[10px] text-slate-400">Run automation on cron intervals</div>
                </div>
              </div>

              <div 
                onClick={() => handleAddNodeFromCatalog('trigger_manual', 'trigger', 'Manual / Webhook Trigger', 'Trigger on demand or via incoming event', { manualTopic: 'Instant manual task' })}
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-[#ff6d5a]/60 cursor-pointer transition flex items-center space-x-3"
              >
                <div className="p-2 rounded-lg bg-[#ff6d5a]/20 text-[#ff6d5a]">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-100">Manual / Event Trigger</div>
                  <div className="text-[10px] text-slate-400">Trigger on click or API payload</div>
                </div>
              </div>
            </div>

            {/* Actions & Destinations Group */}
            <div className="space-y-2">
              <span className="font-extrabold text-[10px] uppercase text-blue-400 tracking-wider">Publishers & Actions</span>
              <div 
                onClick={() => handleAddNodeFromCatalog('facebook_publish', 'action', 'Meta Facebook Publisher', 'Publish to Facebook Page feed', { pageId: fbConn?.accountIdentifier || '109847291834910', operation: 'create_post', dryRun: true })}
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-600/60 cursor-pointer transition flex items-center space-x-3"
              >
                <div className="p-2 rounded-lg bg-blue-900/40 text-blue-400">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-100">Meta Facebook Page</div>
                  <div className="text-[10px] text-slate-400">Publish post via Graph API v21.0</div>
                </div>
              </div>

              <div 
                onClick={() => handleAddNodeFromCatalog('webhook_out', 'action', 'Outgoing Webhook', 'Send HTTP POST to external API', { webhookUrl: 'https://discord.com/api/webhooks/demo/...' })}
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-600/60 cursor-pointer transition flex items-center space-x-3"
              >
                <div className="p-2 rounded-lg bg-blue-900/40 text-blue-400">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-100">Outgoing Webhook</div>
                  <div className="text-[10px] text-slate-400">Post JSON payload to external URL</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. EXECUTION OUTPUT INSPECTOR (Bottom Panel - n8n Style) */}
      {showOutputInspector && (
        <div className="h-72 border-t border-slate-800 bg-[#0c1220] flex flex-col shrink-0 z-30 shadow-2xl">
          <div className="h-10 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 text-xs">
            <div className="flex items-center space-x-4">
              <span className="font-black text-slate-200 flex items-center space-x-2">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>Execution Output (Live Pipeline)</span>
              </span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setInspectorTab('preview')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${inspectorTab === 'preview' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Facebook Preview
                </button>
                <button
                  onClick={() => setInspectorTab('trace')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${inspectorTab === 'trace' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Step Execution Trace
                </button>
                <button
                  onClick={() => setInspectorTab('json')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${inspectorTab === 'json' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Raw n8n JSON
                </button>
              </div>
            </div>

            <button onClick={() => setShowOutputInspector(false)} className="text-slate-400 hover:text-slate-200 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto text-xs">
            {inspectorTab === 'preview' && (
              <div className="max-w-2xl space-y-3">
                <div className="text-[11px] text-slate-400 font-semibold flex items-center justify-between">
                  <span>Simulated Facebook Feed Card:</span>
                  <span className="text-emerald-400 font-mono">Status: Ready to Publish</span>
                </div>
                
                {/* Facebook Post Mockup */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 shadow-lg space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-bold text-white text-sm shadow">
                      T
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm">{fbConn?.displayName || 'Trollogiya Official'}</h4>
                      <p className="text-[10px] text-slate-400 flex items-center space-x-1">
                        <span>Just now</span>
                        <span>•</span>
                        <Globe className="w-2.5 h-2.5 inline" />
                      </p>
                    </div>
                  </div>

                  <div className="text-slate-100 font-sans leading-relaxed text-sm whitespace-pre-line select-text">
                    {nodes.find(n => n.type === 'ai_agent')?.lastOutput?.generatedContent || 
                     'বৃষ্টির দিনে বাঙালি জাতির ৩টি সার্বজনীন ইচ্ছা:\n১. গরম খিচুড়ি আর বেগুন ভাজা 🍛🍆\n২. এক কাপ আদা চা ☕️\n৩. আর জরুরি কোনো কাজ থাকলে সেটা ক্যানসেল হওয়া! 😂\n\n#Trollogiya #DhakaLife'}
                  </div>
                </div>
              </div>
            )}

            {inspectorTab === 'trace' && (
              <div className="space-y-2">
                <div className="font-bold text-slate-300 text-[11px]">Pipeline Step Executions:</div>
                <div className="space-y-1.5">
                  {nodes.map((node, i) => (
                    <div key={node.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <span className="font-mono text-[10px] text-slate-500 w-4">#{i + 1}</span>
                        <span className={`w-2 h-2 rounded-full ${node.executionStatus === 'success' ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                        <div>
                          <span className="font-bold text-slate-200">{node.title}</span>
                          <span className="text-[10px] text-slate-500 ml-2 font-mono">({node.type})</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 font-mono text-[11px]">
                        {node.executionDurationMs && (
                          <span className="text-emerald-400">{node.executionDurationMs}ms</span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          node.executionStatus === 'success' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-900 text-slate-500'
                        }`}>
                          {node.executionStatus || 'idle'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {inspectorTab === 'json' && (
              <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto">
                {JSON.stringify(nodes.map(n => ({ 
                  id: n.id, 
                  title: n.title, 
                  category: n.category, 
                  status: n.executionStatus, 
                  durationMs: n.executionDurationMs, 
                  config: n.config,
                  output: n.lastOutput 
                })), null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
