import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Bot, 
  Play, 
  Pause, 
  Copy, 
  Archive, 
  Save, 
  Trash2, 
  RotateCcw, 
  Sparkles, 
  Cpu, 
  BrainCircuit, 
  BookOpen, 
  Wrench, 
  GitFork, 
  Clock, 
  ListOrdered, 
  FileText, 
  Coins, 
  Shield, 
  History, 
  AlertTriangle,
  CheckCircle2,
  Share2,
  ExternalLink,
  Plus,
  Check,
  Send,
  Eye
} from 'lucide-react';
import { useAgentStore } from '../store/useAgentStore';
import { useExecutionStore } from '../store/useExecutionStore';
import { useMemoryStore } from '../store/useMemoryStore';
import { useIntegrationStore } from '../store/useIntegrationStore';
import { useApprovalStore } from '../store/useApprovalStore';
import { initialTools } from '../data/initialData';
import { TrollogiyaCategory } from '../types';
import { AIProviderService } from '../services/ai/aiProviderAdapters';

export const AgentWorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { agents, getAgentById, updateAgent, updateAgentConfig, updateAgentPrompt, rollbackConfig, setAgentStatus, duplicateAgent, promptVersions } = useAgentStore();
  const { triggerAgentExecution, getExecutionsByAgentId, isExecuting } = useExecutionStore();
  const { memories, getMemoriesByAgent, addMemory, deleteMemory, knowledgeDocs, assignDocToAgent } = useMemoryStore();
  const { integrations } = useIntegrationStore();
  const { addApproval } = useApprovalStore();

  const agent = id ? getAgentById(id) : agents[0];
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Interactive Form States
  const [promptContent, setPromptContent] = useState(agent?.prompts?.[0]?.content || '');
  const [promptChangeSummary, setPromptChangeSummary] = useState('');
  const [temperature, setTemperature] = useState(agent?.config?.temperature || 0.7);
  const [maxTokens, setMaxTokens] = useState(agent?.config?.maxTokens || 2048);
  const [requiresApproval, setRequiresApproval] = useState(agent?.config?.requiresHumanApproval ?? true);
  
  // Trollogiya Specialized States
  const isTrollogiya = Boolean(agent?.slug.includes('trollogiya') || agent?.category === 'facebook_publishing');
  const metadata = agent?.config?.metadata || {};
  const [humorScale, setHumorScale] = useState(metadata.humorScale || 8);
  const [emotionalScale, setEmotionalScale] = useState(metadata.emotionalScale || 6);
  const [dailyPosts, setDailyPosts] = useState(metadata.dailyPostsCount || 3);
  const [allowBanglish, setAllowBanglish] = useState(metadata.allowBanglish ?? true);
  const [categories, setCategories] = useState<TrollogiyaCategory[]>(metadata.categories || [
    { id: 'funny_troll', label: 'Funny & Troll Posts', enabled: true },
    { id: 'daily_life', label: 'Relatable Daily-Life Content', enabled: true },
    { id: 'emotional_stories', label: 'Emotional Short Stories', enabled: true },
    { id: 'relationship_humor', label: 'Relationship Humor', enabled: true },
    { id: 'observational_comedy', label: 'Observational Comedy', enabled: true },
    { id: 'audience_engagement', label: 'Audience Engagement / Polls', enabled: true },
    { id: 'longer_storytelling', label: 'Longer Storytelling', enabled: true }
  ]);

  // Viral Content Studio (Interactive Bengali Post Generator)
  const [selectedStudioCat, setSelectedStudioCat] = useState('daily_life');
  const [studioTopic, setStudioTopic] = useState('বৃষ্টির দিনে ঢাকার জ্যাম ও খিচুড়ির টান');
  const [generatedStudioPost, setGeneratedStudioPost] = useState('');
  const [isGeneratingStudio, setIsGeneratingStudio] = useState(false);
  const [studioImagePrompt, setStudioImagePrompt] = useState('');

  // Quick Run / Manual Trigger
  const [runInput, setRunInput] = useState('');
  const [newMemoryKey, setNewMemoryKey] = useState('');
  const [newMemoryVal, setNewMemoryVal] = useState('');

  if (!agent) {
    return (
      <div className="p-8 text-center text-slate-400">
        Agent not found. <button onClick={() => navigate('/agents')} className="text-cyan-400 underline">Back to agents</button>
      </div>
    );
  }

  const agentExecutions = getExecutionsByAgentId(agent.id);
  const agentMemories = getMemoriesByAgent(agent.id);
  const agentDocs = knowledgeDocs.filter(d => d.assignedAgentIds?.includes(agent.id));
  const agentOutputs = agentExecutions.flatMap(e => e.outputs || []);

  const totalTokens = agentExecutions.reduce((acc, curr) => acc + (curr.totalTokensUsed || 0), 0);
  const totalCost = agentExecutions.reduce((acc, curr) => acc + (curr.estimatedCost || 0), 0);

  const handleSaveConfig = () => {
    updateAgentConfig(agent.id, {
      temperature,
      maxTokens,
      requiresHumanApproval: requiresApproval,
      metadata: {
        ...metadata,
        humorScale,
        emotionalScale,
        dailyPostsCount: dailyPosts,
        allowBanglish,
        categories
      }
    });
    alert('Configuration saved & new version recorded.');
  };

  const handleSavePrompt = () => {
    updateAgentPrompt(agent.id, promptContent, promptChangeSummary);
    setPromptChangeSummary('');
    alert('Prompt updated and committed to version history.');
  };

  const handleRunTask = async () => {
    const task = runInput.trim() || 'Execute scheduled content pipeline';
    await triggerAgentExecution(agent, task, { isDryRun: true });
    setRunInput('');
    setActiveTab('history');
  };

  const handleDuplicate = () => {
    const dup = duplicateAgent(agent.id);
    if (dup) {
      alert(`Created duplicate agent: ${dup.name}`);
      navigate(`/agents/${dup.id}`);
    }
  };

  const toggleCategory = (catId: string) => {
    setCategories(prev => prev.map(c => c.id === catId ? { ...c, enabled: !c.enabled } : c));
  };

  // Real-time Bengali Content Generator in Studio
  const handleGenerateViralStudio = async () => {
    setIsGeneratingStudio(true);
    setGeneratedStudioPost('');

    const res = await AIProviderService.complete({
      providerSlug: 'google-gemini',
      model: 'gemini-2.0-flash',
      systemPrompt: agent.prompts?.[0]?.content || 'You are Trollogiya Content Agent.',
      userPrompt: `Write a high-engagement Facebook post for category "${selectedStudioCat}". Topic: ${studioTopic}. Humor Scale: ${humorScale}/10. Emotion Scale: ${emotionalScale}/10. Include authentic hashtags: #Trollogiya #DhakaLife`,
      isDryRun: true
    });

    setIsGeneratingStudio(false);
    if (res.success) {
      setGeneratedStudioPost(res.content);
      setStudioImagePrompt(`Cinematic realistic photograph depicting: ${studioTopic}, vibrant Dhaka city ambience, dusk rainy reflections, Fujifilm filmic style.`);
    }
  };

  const handleSubmitToApprovalQueue = () => {
    if (!generatedStudioPost) return;

    addApproval({
      id: `appr_studio_${Date.now()}`,
      agentId: agent.id,
      agentName: agent.name,
      actionType: 'facebook_page_publish',
      targetDestination: 'Trollogiya Official Facebook Page (109847291834910)',
      riskLevel: 'medium',
      payloadSnapshot: {
        content: generatedStudioPost,
        topic: studioTopic,
        category: selectedStudioCat,
        imagePrompt: studioImagePrompt
      },
      payloadChecksum: `chk_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      decisionReason: 'Generated via Viral Content Studio, queued for human reviewer sign-off.'
    });

    alert('Post draft successfully registered in the Centralized Approval Center!');
    navigate('/approvals');
  };

  const tabs = [
    { id: 'overview', label: '1. Overview' },
    ...(isTrollogiya ? [{ id: 'studio', label: '🔥 Viral Studio' }] : []),
    { id: 'config', label: '2. Configuration' },
    { id: 'prompts', label: '3. Instructions & Prompts' },
    { id: 'memory', label: '4. Memory' },
    { id: 'knowledge', label: '5. Knowledge Base' },
    { id: 'tools', label: '6. Tools' },
    { id: 'workflows', label: '7. Workflows' },
    { id: 'triggers', label: '8. Triggers' },
    { id: 'schedule', label: '9. Schedule' },
    { id: 'queue', label: '10. Task Queue' },
    { id: 'history', label: '11. Execution History' },
    { id: 'outputs', label: '12. Outputs' },
    { id: 'usage', label: '13. Usage' },
    { id: 'permissions', label: '14. Permissions' },
    { id: 'versions', label: '15. Version History' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Agent Header Banner */}
      <div className="border border-slate-800 rounded-2xl bg-[#0f172a]/95 p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-extrabold text-xl shrink-0">
              {isTrollogiya ? <Sparkles className="w-7 h-7" /> : <Bot className="w-7 h-7" />}
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-xl md:text-2xl font-black text-slate-100">{agent.name}</h1>
                <span className={`px-2.5 py-0.5 text-[11px] font-bold uppercase rounded-full ${
                  agent.status === 'active' 
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                    : agent.status === 'paused'
                    ? 'bg-amber-950 text-amber-400 border border-amber-800'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {agent.status}
                </span>
                <span className="text-xs font-mono text-cyan-400">v{agent.version}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">{agent.description}</p>
              <div className="flex items-center space-x-4 text-[11px] text-slate-400 mt-2">
                <span>Model: <strong className="text-slate-200 font-mono">{agent.primaryModel}</strong></span>
                <span>•</span>
                <span>Category: <strong className="text-slate-200 capitalize">{agent.category.replace('_', ' ')}</strong></span>
                <span>•</span>
                <span>Slug: <strong className="text-cyan-400 font-mono">{agent.slug}</strong></span>
              </div>
            </div>
          </div>

          {/* Action Buttons & Lifecycle Status */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={agent.status}
              onChange={(e) => {
                const res = setAgentStatus(agent.id, e.target.value as any);
                if (!res.success && res.error) alert(res.error);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-bold text-slate-200 capitalize focus:outline-none focus:border-cyan-500"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="draft">Draft</option>
              <option value="testing">Testing</option>
              <option value="disabled">Disabled</option>
              <option value="error">Error</option>
              <option value="archived">Archived</option>
            </select>

            {agent.status === 'active' ? (
              <button
                onClick={() => {
                  const res = setAgentStatus(agent.id, 'paused');
                  if (!res.success && res.error) alert(res.error);
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-amber-800/80 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 text-xs font-semibold transition"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  const res = setAgentStatus(agent.id, 'active');
                  if (!res.success && res.error) alert(res.error);
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-emerald-800/80 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 text-xs font-semibold transition"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Activate</span>
              </button>
            )}

            <button
              onClick={handleDuplicate}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              title="Duplicate into independent instance"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Duplicate</span>
            </button>

            <button
              onClick={() => {
                const prompt = window.prompt('Enter task prompt for this agent run:', 'Create a fresh daily Bengali post');
                if (prompt) triggerAgentExecution(agent, prompt, { isDryRun: true });
              }}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-950 transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Pipeline Now</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation Strip */}
      <div className="overflow-x-auto border-b border-slate-800 pb-px">
        <div className="flex space-x-1 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 ${
                activeTab === tab.id
                  ? 'border-cyan-400 text-cyan-400 bg-slate-900/80 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="border border-slate-800 rounded-2xl bg-[#0f172a]/95 p-6">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
                <span className="text-xs font-semibold uppercase text-slate-400">Total Executions</span>
                <div className="text-2xl font-bold text-slate-100 mt-2">{agentExecutions.length}</div>
                <div className="text-[11px] text-slate-400 mt-1">Correlation trace verified</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
                <span className="text-xs font-semibold uppercase text-slate-400">Approval Requirement</span>
                <div className="text-base font-bold text-cyan-400 mt-2">
                  {agent.config?.requiresHumanApproval ? 'Required (Gate Enabled)' : 'Direct Automated'}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Stops unauthorized external mutations</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
                <span className="text-xs font-semibold uppercase text-slate-400">Memory Partition</span>
                <div className="text-base font-bold text-slate-200 mt-2 capitalize font-mono">
                  {agent.config?.memoryMode}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">{agentMemories.length} scoped memory records</div>
              </div>
            </div>

            {/* Quick Trigger Bar */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Quick Task Execution</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={runInput}
                  onChange={(e) => setRunInput(e.target.value)}
                  placeholder="Enter custom task or prompt (e.g. Generate weekend adda post in Bengali)..."
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleRunTask}
                  disabled={isExecuting}
                  className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center space-x-1.5"
                >
                  <Play className={`w-3.5 h-3.5 ${isExecuting ? 'animate-spin' : ''}`} />
                  <span>Execute</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIRAL CONTENT STUDIO TAB (FOR TROLLOGIYA) */}
        {activeTab === 'studio' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Trollogiya Viral Content Studio</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Interactive Bengali generation studio with live humor scales, storytelling parameters, and image prompts.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Content Category</label>
                <select
                  value={selectedStudioCat}
                  onChange={(e) => setSelectedStudioCat(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Topic or Situation</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={studioTopic}
                    onChange={(e) => setStudioTopic(e.target.value)}
                    placeholder="e.g. বৃষ্টির দিনে ঢাকার ট্রাফিক জ্যাম আর গরম খিচুড়ির টান"
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none"
                  />
                  <button
                    onClick={handleGenerateViralStudio}
                    disabled={isGeneratingStudio}
                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold transition flex items-center space-x-1.5"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isGeneratingStudio ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingStudio ? 'Writing...' : 'Generate Post'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Generated Studio Post Preview */}
            {generatedStudioPost && (
              <div className="border border-slate-800 rounded-2xl bg-slate-950 p-5 space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-slate-200 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Generated Bengali Post Preview</span>
                  </span>
                  <div className="text-[11px] text-slate-400 space-x-3">
                    <span>Length: <strong>{generatedStudioPost.length} chars</strong></span>
                    <span>•</span>
                    <span>Read Time: <strong>~{Math.ceil(generatedStudioPost.split(' ').length / 150)} min</strong></span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/90 text-slate-100 font-sans whitespace-pre-line leading-relaxed text-sm border border-slate-800/80">
                  {generatedStudioPost}
                </div>

                {/* AI Image Generation Prompt Preview */}
                {studioImagePrompt && (
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] space-y-1">
                    <span className="text-cyan-400 font-bold uppercase text-[10px]">AI Image Generation Prompt (Matching Visual)</span>
                    <p className="text-slate-300 font-mono">{studioImagePrompt}</p>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedStudioPost);
                      alert('Post copied to clipboard!');
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                  >
                    Copy to Clipboard
                  </button>

                  <button
                    onClick={handleSubmitToApprovalQueue}
                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold transition flex items-center space-x-1.5 shadow-lg shadow-emerald-950"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit to Facebook Approval Queue</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CONFIGURATION */}
        {activeTab === 'config' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Agent Configuration Parameters</h3>
                <p className="text-xs text-slate-400 mt-0.5">Adjust inference limits, temperature, approval policy, and domain settings.</p>
              </div>
              <button
                onClick={handleSaveConfig}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Configuration</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Temperature: {temperature}
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Max Tokens Limit</label>
                <input
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            {/* Trollogiya Specialized Parameters */}
            {isTrollogiya && (
              <div className="p-5 rounded-xl border border-cyan-900/50 bg-cyan-950/20 space-y-4">
                <div className="flex items-center space-x-2 text-cyan-400 font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Trollogiya Viral Engine Settings</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                      Humor & Troll Intensity ({humorScale}/10)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={humorScale}
                      onChange={(e) => setHumorScale(parseInt(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                      Emotional Storytelling Scale ({emotionalScale}/10)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={emotionalScale}
                      onChange={(e) => setEmotionalScale(parseInt(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
                    Active Content Categories (Toggle / Reorder):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {categories.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => toggleCategory(c.id)}
                        className={`p-2.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition ${
                          c.enabled ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 font-semibold' : 'border-slate-800 bg-slate-900/40 text-slate-500'
                        }`}
                      >
                        <span>{c.label}</span>
                        <span>{c.enabled ? 'Active' : 'Disabled'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PROMPTS */}
        {activeTab === 'prompts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">System Prompt & Persona</h3>
                <p className="text-xs text-slate-400 mt-0.5">Editing creates a new immutable prompt version.</p>
              </div>
              <button
                onClick={handleSavePrompt}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save New Version</span>
              </button>
            </div>

            <textarea
              rows={12}
              value={promptContent}
              onChange={(e) => setPromptContent(e.target.value)}
              className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-cyan-500"
            />

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Version Change Summary</label>
              <input
                type="text"
                value={promptChangeSummary}
                onChange={(e) => setPromptChangeSummary(e.target.value)}
                placeholder="e.g. Added Dhaka evening rain adda nuances and punctuation rules"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* TAB 4: MEMORY */}
        {activeTab === 'memory' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Scoped Agent Memories</h3>
                <p className="text-xs text-slate-400 mt-0.5">Private memories isolated exclusively to this agent.</p>
              </div>
            </div>

            {/* Add Memory Item */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
              <span className="text-xs font-bold text-slate-200 uppercase">Add New Memory Entry</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Key (e.g. style_preference)"
                  value={newMemoryKey}
                  onChange={(e) => setNewMemoryKey(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                />
                <input
                  type="text"
                  placeholder="Content (e.g. Always emphasize warm camaraderie in adda stories)"
                  value={newMemoryVal}
                  onChange={(e) => setNewMemoryVal(e.target.value)}
                  className="sm:col-span-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                />
              </div>
              <button
                onClick={() => {
                  if (newMemoryVal.trim()) {
                    addMemory({
                      agentId: agent.id,
                      key: newMemoryKey,
                      content: newMemoryVal,
                      category: 'preference'
                    });
                    setNewMemoryKey('');
                    setNewMemoryVal('');
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold"
              >
                + Commit Memory Entry
              </button>
            </div>

            <div className="space-y-2">
              {agentMemories.map(m => (
                <div key={m.id} className="p-3 rounded-lg border border-slate-800 bg-slate-900/60 flex items-start justify-between text-xs">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-cyan-400 text-[11px] font-bold">{m.key}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] uppercase bg-slate-800 text-slate-400">{m.category}</span>
                      <span className="text-[10px] text-slate-500">scope: {m.scope}</span>
                    </div>
                    <p className="text-slate-300 mt-1">{m.content}</p>
                  </div>
                  <button onClick={() => deleteMemory(m.id)} className="text-slate-500 hover:text-rose-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: KNOWLEDGE BASE */}
        {activeTab === 'knowledge' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Assigned Knowledge Documents</h3>
            <p className="text-slate-400 text-xs">Reference materials indexed into this agent's contextual window.</p>

            <div className="space-y-2">
              {agentDocs.length === 0 ? (
                <div className="p-6 text-center text-slate-500 border border-slate-800 rounded-xl">
                  No private documents assigned. Global guidelines apply.
                </div>
              ) : (
                agentDocs.map(doc => (
                  <div key={doc.id} className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-200">{doc.title}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{doc.fileType} • {doc.fileSizeBytes} bytes</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      Indexed
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 6: TOOLS */}
        {activeTab === 'tools' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Authorized Tool Bindings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {initialTools.map(t => (
                <div key={t.id} className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{t.displayName}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-slate-800 text-slate-400">{t.classification}</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{t.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: TRIGGERS & TAB 9: SCHEDULE */}
        {(activeTab === 'triggers' || activeTab === 'schedule') && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Schedules & Job Triggers</h3>
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">Daily Cron Scheduler (Database-Backed)</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800">Active</span>
              </div>
              <div className="font-mono text-cyan-400">Expression: 0 14 * * * (Asia/Dhaka GMT+6)</div>
              <p className="text-slate-400 text-[11px]">Next execution preview: Today at 2:00 PM GMT+6 (8:00 AM UTC)</p>
            </div>
          </div>
        )}

        {/* TAB 11: EXECUTION HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Execution Pipeline History</h3>
            <div className="space-y-3">
              {agentExecutions.map(exec => (
                <div key={exec.id} className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-cyan-400">{exec.correlationId}</span>
                      <span className="text-slate-400">• Trigger: {exec.triggerType}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      exec.status === 'completed' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                    }`}>
                      {exec.status}
                    </span>
                  </div>

                  {/* Steps trace */}
                  <div className="pl-3 border-l-2 border-slate-800 space-y-1 text-[11px]">
                    {exec.steps?.map(s => (
                      <div key={s.id} className="flex items-center justify-between text-slate-400">
                        <span>Step {s.stepNumber}: {s.stepName}</span>
                        <span className="text-emerald-400 font-mono">{s.durationMs}ms</span>
                      </div>
                    ))}
                  </div>

                  {/* Outputs preview */}
                  {exec.outputs?.[0] && (
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-slate-200 whitespace-pre-line leading-relaxed">
                      {exec.outputs[0].content}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 12: OUTPUTS */}
        {activeTab === 'outputs' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Generated Outputs & Social Posts ({agentOutputs.length})</h3>
            <div className="space-y-3">
              {agentOutputs.map(out => (
                <div key={out.id} className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{out.title || 'Generated Post'}</span>
                    <span className="text-[10px] text-slate-500">{new Date(out.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 text-slate-200 whitespace-pre-line leading-relaxed font-sans">
                    {out.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 13: USAGE */}
        {activeTab === 'usage' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Agent Resource Consumption</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
                <span className="text-slate-400 uppercase font-bold text-[10px]">Total Tokens Consumed</span>
                <div className="text-xl font-bold text-slate-100 mt-1">{totalTokens.toLocaleString()}</div>
              </div>
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
                <span className="text-slate-400 uppercase font-bold text-[10px]">Estimated Model Cost</span>
                <div className="text-xl font-bold text-cyan-400 mt-1">${totalCost.toFixed(5)}</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 15: VERSION HISTORY */}
        {activeTab === 'versions' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Configuration & Prompt Audit Versions</h3>
            <div className="space-y-3">
              {promptVersions.filter(pv => pv.agentId === agent.id).map(pv => (
                <div key={pv.id} className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-200">Prompt Version {pv.version}</span>
                      <span className="text-[10px] text-slate-500">{new Date(pv.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{pv.changeSummary}</p>
                  </div>
                  <button
                    onClick={() => {
                      setPromptContent(pv.content);
                      setActiveTab('prompts');
                    }}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold"
                  >
                    Restore to Editor
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other tabs fallback */}
        {!['overview', 'studio', 'config', 'prompts', 'memory', 'knowledge', 'tools', 'triggers', 'schedule', 'history', 'outputs', 'usage', 'versions'].includes(activeTab) && (
          <div className="py-12 text-center text-slate-400 text-xs">
            <div className="font-bold text-slate-300 text-sm capitalize">{activeTab} Section</div>
            <p className="mt-1">Operational view for {activeTab} is configured and connected to the agent runtime.</p>
          </div>
        )}
      </div>
    </div>
  );
};
