import { create } from 'zustand';
import { Agent, AgentStatus, AgentConfig, AgentPrompt, PromptVersion } from '../types';
import { initialAgents } from '../data/initialData';

interface AgentState {
  agents: Agent[];
  selectedAgentId: string | null;
  promptVersions: PromptVersion[];
  
  // Actions
  selectAgent: (id: string | null) => void;
  getAgentById: (id: string) => Agent | undefined;
  getAgentBySlug: (slug: string) => Agent | undefined;
  createAgent: (agentData: Partial<Agent>, configData?: Partial<AgentConfig>, systemPrompt?: string) => Agent;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  updateAgentConfig: (agentId: string, updates: Partial<AgentConfig>) => void;
  updateAgentPrompt: (agentId: string, content: string, changeSummary: string) => void;
  rollbackConfig: (agentId: string, targetVersion: number) => void;
  setAgentStatus: (id: string, status: AgentStatus) => void;
  duplicateAgent: (sourceAgentId: string, newName?: string) => Agent | null;
  archiveAgent: (id: string) => void;
  deleteAgent: (id: string) => void;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: initialAgents,
  selectedAgentId: initialAgents[0]?.id || null,
  promptVersions: [
    {
      id: 'pv-01',
      agentPromptId: 'p-troll-01',
      agentId: '33333333-3333-3333-3333-333333333301',
      version: 1,
      content: initialAgents[0]?.prompts?.[0]?.content || '',
      changeSummary: 'Initial base persona and Bengali guidelines version',
      createdBy: 'admin@zuuagent.ai',
      createdAt: '2026-10-10T12:00:00Z'
    }
  ],

  selectAgent: (id) => set({ selectedAgentId: id }),

  getAgentById: (id) => get().agents.find(a => a.id === id),
  getAgentBySlug: (slug) => get().agents.find(a => a.slug === slug),

  createAgent: (agentData, configData, systemPrompt) => {
    const newId = `agent_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const slug = agentData.slug || agentData.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `agent-${Date.now()}`;
    
    const config: AgentConfig = {
      id: `cfg_${newId}`,
      agentId: newId,
      version: 1,
      temperature: configData?.temperature ?? 0.7,
      maxTokens: configData?.maxTokens ?? 2048,
      topP: configData?.topP ?? 1.0,
      timeoutSeconds: configData?.timeoutSeconds ?? 60,
      retryPolicy: configData?.retryPolicy ?? { maxRetries: 2, backoffMs: 1500 },
      memoryMode: configData?.memoryMode ?? 'isolated',
      requiresHumanApproval: configData?.requiresHumanApproval ?? false,
      maxDailyExecutions: configData?.maxDailyExecutions ?? 100,
      executionTimeoutMs: 120000,
      metadata: configData?.metadata ?? {},
      createdAt: new Date().toISOString()
    };

    const prompt: AgentPrompt = {
      id: `prompt_${newId}`,
      agentId: newId,
      promptType: 'system',
      currentVersion: 1,
      content: systemPrompt || `You are ${agentData.name || 'an AI agent'}. Execute your instructions reliably.`,
      updatedAt: new Date().toISOString()
    };

    const newAgent: Agent = {
      id: newId,
      name: agentData.name || 'Untitled Agent',
      slug,
      description: agentData.description || 'Configurable autonomous AI agent',
      icon: agentData.icon || 'bot',
      category: agentData.category || 'custom',
      tags: agentData.tags || ['custom'],
      status: agentData.status || 'draft',
      primaryProviderId: agentData.primaryProviderId || '11111111-1111-1111-1111-111111111101',
      primaryModel: agentData.primaryModel || 'gemini-2.0-flash',
      version: 1,
      isTemplate: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      enabledToolsCount: 0,
      config,
      prompts: [prompt]
    };

    set(state => ({ agents: [newAgent, ...state.agents] }));
    return newAgent;
  },

  updateAgent: (id, updates) => {
    set(state => ({
      agents: state.agents.map(agent => 
        agent.id === id 
          ? { ...agent, ...updates, updatedAt: new Date().toISOString() } 
          : agent
      )
    }));
  },

  updateAgentConfig: (agentId, updates) => {
    set(state => ({
      agents: state.agents.map(agent => {
        if (agent.id !== agentId) return agent;
        const currentConfig = agent.config || {
          id: `cfg_${agentId}`,
          agentId,
          version: 1,
          temperature: 0.7,
          maxTokens: 2048,
          topP: 1.0,
          timeoutSeconds: 60,
          retryPolicy: { maxRetries: 2, backoffMs: 1500 },
          memoryMode: 'isolated',
          requiresHumanApproval: false,
          maxDailyExecutions: 100,
          executionTimeoutMs: 120000,
          createdAt: new Date().toISOString()
        };
        const nextVersion = currentConfig.version + 1;
        return {
          ...agent,
          version: nextVersion,
          config: { ...currentConfig, ...updates, version: nextVersion },
          updatedAt: new Date().toISOString()
        };
      })
    }));
  },

  updateAgentPrompt: (agentId, content, changeSummary) => {
    const agent = get().getAgentById(agentId);
    if (!agent) return;

    const currentPrompt = agent.prompts?.[0];
    const nextVer = (currentPrompt?.currentVersion || 1) + 1;
    const promptId = currentPrompt?.id || `prompt_${agentId}`;

    const newVersionRecord: PromptVersion = {
      id: `pv_${Date.now()}`,
      agentPromptId: promptId,
      agentId,
      version: nextVer,
      content,
      changeSummary: changeSummary || `Version ${nextVer} update`,
      createdBy: 'admin@zuuagent.ai',
      createdAt: new Date().toISOString()
    };

    set(state => ({
      promptVersions: [newVersionRecord, ...state.promptVersions],
      agents: state.agents.map(a => {
        if (a.id !== agentId) return a;
        return {
          ...a,
          prompts: [{
            id: promptId,
            agentId,
            promptType: 'system',
            currentVersion: nextVer,
            content,
            updatedAt: new Date().toISOString()
          }],
          updatedAt: new Date().toISOString()
        };
      })
    }));
  },

  rollbackConfig: (agentId, targetVersion) => {
    set(state => ({
      agents: state.agents.map(a => {
        if (a.id !== agentId || !a.config) return a;
        return {
          ...a,
          config: {
            ...a.config,
            version: targetVersion
          },
          updatedAt: new Date().toISOString()
        };
      })
    }));
  },

  setAgentStatus: (id, status) => {
    set(state => ({
      agents: state.agents.map(a => 
        a.id === id ? { ...a, status, updatedAt: new Date().toISOString() } : a
      )
    }));
  },

  duplicateAgent: (sourceAgentId, newName) => {
    const source = get().getAgentById(sourceAgentId);
    if (!source) return null;

    const newId = `agent_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const clonedName = newName || `${source.name} (Copy)`;
    const clonedSlug = `${source.slug}-copy-${Date.now().toString(36)}`;

    // Safe independent duplicate: NO private credentials, separate UUID
    const clonedConfig: AgentConfig = source.config ? {
      ...JSON.parse(JSON.stringify(source.config)),
      id: `cfg_${newId}`,
      agentId: newId,
      version: 1,
      createdAt: new Date().toISOString()
    } : {
      id: `cfg_${newId}`,
      agentId: newId,
      version: 1,
      temperature: 0.7,
      maxTokens: 2048,
      topP: 1.0,
      timeoutSeconds: 60,
      retryPolicy: { maxRetries: 2, backoffMs: 1500 },
      memoryMode: 'isolated',
      requiresHumanApproval: true,
      maxDailyExecutions: 50,
      executionTimeoutMs: 120000,
      createdAt: new Date().toISOString()
    };

    const clonedPrompts: AgentPrompt[] = source.prompts ? source.prompts.map(p => ({
      ...p,
      id: `prompt_${newId}_${p.promptType}`,
      agentId: newId,
      currentVersion: 1,
      updatedAt: new Date().toISOString()
    })) : [];

    const newAgent: Agent = {
      id: newId,
      name: clonedName,
      slug: clonedSlug,
      description: source.description,
      icon: source.icon,
      category: source.category,
      tags: [...source.tags, 'duplicate'],
      status: 'draft', // Duplicated agents safely start as draft
      primaryProviderId: source.primaryProviderId,
      primaryModel: source.primaryModel,
      version: 1,
      isTemplate: false,
      templateOrigin: source.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      enabledToolsCount: source.enabledToolsCount,
      config: clonedConfig,
      prompts: clonedPrompts
    };

    set(state => ({ agents: [newAgent, ...state.agents] }));
    return newAgent;
  },

  archiveAgent: (id) => {
    set(state => ({
      agents: state.agents.map(a => 
        a.id === id ? { ...a, status: 'archived', updatedAt: new Date().toISOString() } : a
      )
    }));
  },

  deleteAgent: (id) => {
    set(state => ({
      agents: state.agents.filter(a => a.id !== id),
      selectedAgentId: state.selectedAgentId === id ? null : state.selectedAgentId
    }));
  }
}));
