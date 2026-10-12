import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Bot, 
  Cpu, 
  BrainCircuit, 
  Wrench, 
  Clock, 
  GitFork, 
  FlaskConical, 
  Save, 
  AlertCircle,
  Play
} from 'lucide-react';
import { useAgentStore } from '../store/useAgentStore';
import { useProviderStore } from '../store/useProviderStore';
import { useExecutionStore } from '../store/useExecutionStore';
import { AgentCategory, AgentStatus } from '../types';
import { AgentRuntimeEngine } from '../services/engine/agentRuntimeEngine';

export const AgentBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const { createAgent } = useAgentStore();
  const { providers, models } = useProviderStore();

  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Basic Info
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<AgentCategory>('social_media');
  const [tagsInput, setTagsInput] = useState('automation, ai');

  // Step 2: Agent Type / Template Preset
  const [selectedTemplate, setSelectedTemplate] = useState('trollogiya');

  // Step 3: AI Configuration
  const [providerId, setProviderId] = useState(providers[0]?.id || '11111111-1111-1111-1111-111111111101');
  const [model, setModel] = useState('gemini-2.0-flash');
  const [temperature, setTemperature] = useState(0.8);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [systemPrompt, setSystemPrompt] = useState(
    'You are a specialized AI agent designed for high-quality structured task execution.'
  );
  const [requiresApproval, setRequiresApproval] = useState(true);

  // Step 4: Memory
  const [memoryMode, setMemoryMode] = useState<'none' | 'isolated' | 'shared_explicit' | 'global_read'>('isolated');

  // Step 5: Tools
  const [selectedTools, setSelectedTools] = useState<string[]>([
    'meta_facebook_page_publisher',
    'bengali_content_enhancer',
    'image_asset_generator'
  ]);

  // Step 6: Triggers
  const [triggerType, setTriggerType] = useState('schedule');
  const [cronSchedule, setCronSchedule] = useState('0 14 * * *');

  // Step 7: Workflow
  const [workflowMode, setWorkflowMode] = useState<'simple_pipeline' | 'multi_step'>('simple_pipeline');

  // Step 8: Sandbox Test State
  const [testPrompt, setTaskPrompt] = useState('Create a witty Bengali post about rainy day cravings');
  const [testOutput, setTestOutput] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Step 9: Save Status
  const [finalStatus, setFinalStatus] = useState<AgentStatus>('active');

  // Auto-generate slug from name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]+/g, '-')) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    }
  };

  // Apply Template Presets
  const applyTemplate = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    if (templateKey === 'trollogiya') {
      setName('Trollogiya Content Creator');
      setCategory('facebook_publishing');
      setDescription('Bangladeshi Bengali & Banglish viral content creator for witty humor and daily life adda.');
      setSystemPrompt(`You are "Trollogiya Content Agent", the premier viral Bangladeshi social media storyteller and entertainer for Facebook. 
Your goal is to write captivating, authentic Bengali (and natural Banglish when fitting) posts that deeply resonate with Bangladeshi audiences.`);
      setTemperature(0.85);
      setSelectedTools(['meta_facebook_page_publisher', 'bengali_content_enhancer', 'image_asset_generator']);
      setRequiresApproval(true);
    } else if (templateKey === 'support') {
      setName('Customer Support AI');
      setCategory('customer_support');
      setDescription('Empathetic and accurate customer query resolution and ticketing triage.');
      setSystemPrompt('You are an expert customer service specialist for Zuu Agent platform.');
      setTemperature(0.3);
      setSelectedTools(['database_query']);
      setRequiresApproval(false);
    } else if (templateKey === 'research') {
      setName('Deep Research Scout');
      setCategory('research');
      setDescription('Autonomous research, citation gathering, and synthesis.');
      setSystemPrompt('You are an expert investigative research assistant with deep citation standards.');
      setTemperature(0.4);
      setSelectedTools(['web_search']);
      setRequiresApproval(false);
    }
  };

  const handleRunSandboxTest = async () => {
    setIsTesting(true);
    setTestOutput(null);

    // Mock agent payload for sandbox test
    const dummyAgent: any = {
      id: 'sandbox-test-agent',
      name: name || 'Test Agent',
      slug: slug || 'test-agent',
      description,
      icon: 'sparkles',
      category,
      tags: ['test'],
      status: 'testing',
      primaryProviderId: providerId,
      primaryModel: model,
      version: 1,
      prompts: [{ content: systemPrompt }],
      config: {
        temperature,
        maxTokens,
        memoryMode,
        requiresHumanApproval: requiresApproval,
        metadata: {
          humorScale: 8
        }
      }
    };

    const result = await AgentRuntimeEngine.executeAgent({
      agent: dummyAgent,
      taskPrompt: testPrompt,
      isDryRun: true
    });

    setTestOutput(result);
    setIsTesting(false);
  };

  const handleSaveAndActivate = () => {
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

    const created = createAgent(
      {
        name: name || 'New Autonomous Agent',
        slug: slug || `agent-${Date.now()}`,
        description: description || 'Universal AI automation agent',
        category,
        tags,
        status: finalStatus,
        primaryProviderId: providerId,
        primaryModel: model,
        enabledToolsCount: selectedTools.length
      },
      {
        temperature,
        maxTokens,
        memoryMode,
        requiresHumanApproval: requiresApproval,
        metadata: {
          cronSchedule,
          selectedTools
        }
      },
      systemPrompt
    );

    navigate(`/agents/${created.id}`);
  };

  const stepsList = [
    { num: 1, title: 'Basic Info', icon: Bot },
    { num: 2, title: 'Template', icon: Sparkles },
    { num: 3, title: 'AI Config', icon: Cpu },
    { num: 4, title: 'Memory', icon: BrainCircuit },
    { num: 5, title: 'Tools', icon: Wrench },
    { num: 6, title: 'Triggers', icon: Clock },
    { num: 7, title: 'Workflow', icon: GitFork },
    { num: 8, title: 'Sandbox Test', icon: FlaskConical },
    { num: 9, title: 'Save & Deploy', icon: Save }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">
          Universal Agent Builder
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Configure an autonomous agent instance without touching source code.
        </p>
      </div>

      {/* Stepper Wizard Bar */}
      <div className="overflow-x-auto pb-2">
        <div className="flex items-center justify-between min-w-[700px] bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          {stepsList.map((step, idx) => {
            const isCompleted = currentStep > step.num;
            const isCurrent = currentStep === step.num;
            const Icon = step.icon;

            return (
              <React.Fragment key={step.num}>
                <button
                  onClick={() => setCurrentStep(step.num)}
                  className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isCurrent 
                      ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' 
                      : isCompleted
                      ? 'text-emerald-400 hover:bg-slate-800'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    isCompleted ? 'bg-emerald-500 text-slate-950' : isCurrent ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : step.num}
                  </div>
                  <span>{step.title}</span>
                </button>
                {idx < stepsList.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-slate-700 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Wizard Step Panels */}
      <div className="border border-slate-800 rounded-2xl bg-[#0f172a]/95 p-6 md:p-8 space-y-6">
        {/* STEP 1: BASIC INFO */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-100">Step 1: Basic Information</h2>
            <p className="text-xs text-slate-400">Establish the agent identity, unique identifier slug, and categorization.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Agent Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Trollogiya Bengali Content Agent"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Unique Slug *</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. trollogiya-content-agent"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-400 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Description & Purpose</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this agent's core goal, target audience, and output responsibility?"
                className="w-full p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as AgentCategory)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="social_media">Social Media Content Agent</option>
                  <option value="facebook_publishing">Facebook Publishing Agent</option>
                  <option value="instagram_content">Instagram Content Agent</option>
                  <option value="customer_support">Customer Support Agent</option>
                  <option value="research">Research Agent</option>
                  <option value="document_processing">Document Processing Agent</option>
                  <option value="scheduled_task">Scheduled Task Agent</option>
                  <option value="data_analysis">Data Analysis Agent</option>
                  <option value="custom">Custom AI Agent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="bengali, humor, social, automated"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: TEMPLATE PRESETS */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-100">Step 2: Choose Agent Template Preset</h2>
            <p className="text-xs text-slate-400">Select a pre-architected starting configuration or build from scratch.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div
                onClick={() => applyTemplate('trollogiya')}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  selectedTemplate === 'trollogiya' 
                    ? 'border-cyan-500 bg-cyan-950/30' 
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2 text-cyan-400 font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Trollogiya Content Agent</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Bengali & Banglish viral content creator with humor scales, 3 daily posts preset, and Facebook Page publisher.
                </p>
                <span className="mt-3 inline-block px-2 py-0.5 rounded text-[10px] bg-cyan-900 text-cyan-300 font-semibold">
                  Recommended Template
                </span>
              </div>

              <div
                onClick={() => applyTemplate('support')}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  selectedTemplate === 'support' 
                    ? 'border-cyan-500 bg-cyan-950/30' 
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2 text-blue-400 font-bold text-sm">
                  <Bot className="w-4 h-4" />
                  <span>Customer Support AI</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  24/7 ticket resolution, policy adherence, empathetic tone, and escalation triggers.
                </p>
              </div>

              <div
                onClick={() => applyTemplate('research')}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  selectedTemplate === 'research' 
                    ? 'border-cyan-500 bg-cyan-950/30' 
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2 text-violet-400 font-bold text-sm">
                  <Cpu className="w-4 h-4" />
                  <span>Deep Research Scout</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Autonomous topic investigation, web searches, evidence gathering, and cited reports.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: AI CONFIGURATION */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-100">Step 3: AI Model & Prompt Architecture</h2>
            <p className="text-xs text-slate-400">Configure provider adapter, model, temperature, and system prompt instructions.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">AI Provider</label>
                <select
                  value={providerId}
                  onChange={(e) => setProviderId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.adapterType})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Target Model</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                >
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash (Fastest / Recommended)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Context)</option>
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                  <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                  <option value="llama3:8b">Llama 3 (Local Ollama)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                System Prompt & Operating Instructions
              </label>
              <textarea
                rows={6}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono leading-relaxed"
              />
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

              <div className="flex items-center space-x-3 pt-4">
                <input
                  type="checkbox"
                  id="approvalReq"
                  checked={requiresApproval}
                  onChange={(e) => setRequiresApproval(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-800 text-cyan-500 focus:ring-0 w-4 h-4"
                />
                <label htmlFor="approvalReq" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Require Human Approval before publishing / mutations
                </label>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: MEMORY */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-100">Step 4: Scoped Memory Center</h2>
            <p className="text-xs text-slate-400">Select memory boundaries to ensure tenant and agent isolation.</p>

            <div className="space-y-3 pt-2">
              <label className="flex items-start space-x-3 p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 cursor-pointer">
                <input
                  type="radio"
                  name="memMode"
                  value="isolated"
                  checked={memoryMode === 'isolated'}
                  onChange={() => setMemoryMode('isolated')}
                  className="mt-0.5 text-cyan-500"
                />
                <div>
                  <div className="text-xs font-bold text-slate-200">Isolated Agent-Specific Memory (Default & Secure)</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Memories recorded by this agent are completely private and never leak to other agents.
                  </div>
                </div>
              </label>

              <label className="flex items-start space-x-3 p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 cursor-pointer">
                <input
                  type="radio"
                  name="memMode"
                  value="global_read"
                  checked={memoryMode === 'global_read'}
                  onChange={() => setMemoryMode('global_read')}
                  className="mt-0.5 text-cyan-500"
                />
                <div>
                  <div className="text-xs font-bold text-slate-200">Global Read + Isolated Write</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Can read approved organization-wide guidelines while writing only to its private partition.
                  </div>
                </div>
              </label>

              <label className="flex items-start space-x-3 p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 cursor-pointer">
                <input
                  type="radio"
                  name="memMode"
                  value="none"
                  checked={memoryMode === 'none'}
                  onChange={() => setMemoryMode('none')}
                  className="mt-0.5 text-cyan-500"
                />
                <div>
                  <div className="text-xs font-bold text-slate-200">Stateless / No Persistent Memory</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Zero retention between runs. Ideal for strictly confidential data processing.
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* STEP 5: TOOLS */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-100">Step 5: Authorized Tool Bindings</h2>
            <p className="text-xs text-slate-400">Assign executable capabilities verified by server-side authorization.</p>

            <div className="space-y-3 pt-2">
              {[
                { id: 'meta_facebook_page_publisher', name: 'Facebook Page Publisher', desc: 'Publishes posts to Meta Pages via Graph API', type: 'external_mutation' },
                { id: 'bengali_content_enhancer', name: 'Bengali Content Stylizer', desc: 'Applies authentic Bengali humor & hashtags', type: 'data_transformation' },
                { id: 'image_asset_generator', name: 'AI Image Generator', desc: 'Synthesizes matching visual assets', type: 'external_communication' },
                { id: 'web_search', name: 'Live Web Search', desc: 'Searches real-time internet topics', type: 'read_only' },
                { id: 'database_query', name: 'Database Query Service', desc: 'Reads parameterized internal data tables', type: 'read_only' }
              ].map(tool => {
                const isSelected = selectedTools.includes(tool.id);
                return (
                  <div 
                    key={tool.id}
                    onClick={() => {
                      setSelectedTools(prev => 
                        prev.includes(tool.id) ? prev.filter(t => t !== tool.id) : [...prev, tool.id]
                      );
                    }}
                    className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      isSelected ? 'border-cyan-500 bg-cyan-950/30' : 'border-slate-800 bg-slate-900/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-200">{tool.name}</span>
                        <span className="px-1.5 py-0.5 text-[9px] rounded font-mono uppercase bg-slate-800 text-slate-400">
                          {tool.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{tool.desc}</p>
                    </div>

                    <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                      isSelected ? 'bg-cyan-500 border-cyan-500 text-slate-950' : 'border-slate-700 bg-slate-800'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 6: TRIGGERS */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-100">Step 6: Execution Triggers</h2>
            <p className="text-xs text-slate-400">Choose how this agent is activated in production.</p>

            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {['schedule', 'manual', 'webhook'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTriggerType(t)}
                    className={`p-3 rounded-xl border text-center capitalize text-xs font-semibold ${
                      triggerType === t ? 'border-cyan-500 bg-cyan-950/40 text-cyan-400' : 'border-slate-800 bg-slate-900/60 text-slate-300'
                    }`}
                  >
                    {t} Trigger
                  </button>
                ))}
              </div>

              {triggerType === 'schedule' && (
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2">
                  <label className="block text-xs font-semibold uppercase text-slate-400">Cron Schedule Expression</label>
                  <input
                    type="text"
                    value={cronSchedule}
                    onChange={(e) => setCronSchedule(e.target.value)}
                    placeholder="0 14 * * *"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-400 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400">
                    Runs daily at 2:00 PM (14:00 UTC) according to database-backed scheduler.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 7: WORKFLOW */}
        {currentStep === 7 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-100">Step 7: Workflow Execution Engine</h2>
            <p className="text-xs text-slate-400">Select orchestration mode between direct pipeline or node workflow.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div
                onClick={() => setWorkflowMode('simple_pipeline')}
                className={`p-4 rounded-xl border cursor-pointer ${
                  workflowMode === 'simple_pipeline' ? 'border-cyan-500 bg-cyan-950/30' : 'border-slate-800 bg-slate-900/60'
                }`}
              >
                <div className="text-xs font-bold text-slate-200">Standard Sequential Pipeline</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  16-step validated lifecycle: Prompt Resolution → Scoped Memory → AI Inference → Tool Verification → Approval Gate → Publishing.
                </div>
              </div>

              <div
                onClick={() => setWorkflowMode('multi_step')}
                className={`p-4 rounded-xl border cursor-pointer ${
                  workflowMode === 'multi_step' ? 'border-cyan-500 bg-cyan-950/30' : 'border-slate-800 bg-slate-900/60'
                }`}
              >
                <div className="text-xs font-bold text-slate-200">Custom Node Workflow Builder</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Attach an interactive multi-node graph with conditional branching and agent-to-agent delegation.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 8: TEST / SANDBOX */}
        {currentStep === 8 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-100">Step 8: Live Sandbox Test</h2>
            <p className="text-xs text-slate-400">Run a simulated execution through the pipeline before committing configuration.</p>

            <div className="space-y-3 pt-2">
              <label className="block text-xs font-semibold uppercase text-slate-400">Sample Input Prompt</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testPrompt}
                  onChange={(e) => setTaskPrompt(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleRunSandboxTest}
                  disabled={isTesting}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition"
                >
                  <Play className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Simulating...' : 'Run Sandbox'}</span>
                </button>
              </div>

              {testOutput && (
                <div className="mt-4 p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-slate-200">Sandbox Trace Result</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      testOutput.execution.status === 'completed' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                    }`}>
                      {testOutput.execution.status}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Generated Output:</span>
                    <div className="p-3 mt-1 rounded bg-slate-900 text-slate-200 font-sans whitespace-pre-line leading-relaxed">
                      {testOutput.execution.outputs?.[0]?.content}
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center space-x-3 pt-2">
                    <span>Duration: {testOutput.execution.durationMs}ms</span>
                    <span>•</span>
                    <span>Tokens: {testOutput.execution.totalTokensUsed}</span>
                    <span>•</span>
                    <span>Approval Gate: {testOutput.requiresApproval ? 'Enforced' : 'Bypassed'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 9: SAVE AND ACTIVATE */}
        {currentStep === 9 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-100">Step 9: Save & Activate Agent</h2>
            <p className="text-xs text-slate-400">Select initial deployment status and commit to database.</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {(['active', 'draft', 'testing'] as AgentStatus[]).map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFinalStatus(st)}
                  className={`p-4 rounded-xl border text-center capitalize text-xs font-bold transition ${
                    finalStatus === st ? 'border-cyan-500 bg-cyan-950/40 text-cyan-400' : 'border-slate-800 bg-slate-900/60 text-slate-300'
                  }`}
                >
                  Set as {st}
                </button>
              ))}
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 text-xs text-slate-400 space-y-1">
              <div>Agent Name: <span className="font-semibold text-slate-200">{name || 'Untitled'}</span></div>
              <div>Slug: <span className="font-mono text-cyan-400">{slug || 'n/a'}</span></div>
              <div>Model: <span className="font-mono text-slate-200">{model}</span></div>
              <div>Bound Tools: <span className="text-slate-200">{selectedTools.length} tools</span></div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-800">
          <button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-slate-300 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Step</span>
          </button>

          {currentStep < 9 ? (
            <button
              onClick={() => setCurrentStep(prev => Math.min(9, prev + 1))}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950 transition"
            >
              <span>Next Step</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSaveAndActivate}
              className="flex items-center space-x-1.5 px-6 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 transition"
            >
              <Save className="w-4 h-4" />
              <span>Save & Launch Agent</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
