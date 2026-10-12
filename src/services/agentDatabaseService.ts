// ==============================================================================
// Zuu Agent — Database Service for Agents, Configurations & Prompt Versions
// Handles bidirectional mapping between TypeScript domain types & Supabase PostgreSQL
// ==============================================================================

import { supabase, isSupabaseConfigured } from './supabase';
import { Agent, AgentConfig, AgentPrompt, PromptVersion, AgentStatus } from '../types';

const LOCAL_STORAGE_AGENTS_KEY = 'zuu_agents_store_v2';
const LOCAL_STORAGE_PROMPT_VERSIONS_KEY = 'zuu_prompt_versions_store_v2';

// Safe UUID generator using Web Crypto API
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Lifecycle State Machine Transition Rules
export const VALID_LIFECYCLE_TRANSITIONS: Record<AgentStatus, AgentStatus[]> = {
  draft: ['testing', 'active', 'archived'],
  testing: ['draft', 'active', 'error', 'archived'],
  active: ['paused', 'disabled', 'error', 'archived'],
  paused: ['active', 'disabled', 'archived'],
  disabled: ['active', 'paused', 'archived'],
  error: ['draft', 'testing', 'active', 'archived'],
  archived: ['draft']
};

export function isValidLifecycleTransition(current: AgentStatus, next: AgentStatus): boolean {
  if (current === next) return true;
  const allowed = VALID_LIFECYCLE_TRANSITIONS[current] || [];
  return allowed.includes(next);
}

/**
 * Load all agents from Supabase or LocalStorage
 */
export async function loadAgentsFromStorage(seedFallback: Agent[]): Promise<Agent[]> {
  // 1. Try Supabase Cloud if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: dbAgents, error: agentsErr } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false });

      if (!agentsErr && dbAgents && dbAgents.length > 0) {
        // Fetch configs and prompts for these agents
        const agentIds = dbAgents.map(a => a.id);
        const { data: dbConfigs } = await supabase
          .from('agent_configs')
          .select('*')
          .in('agent_id', agentIds);

        const { data: dbPrompts } = await supabase
          .from('agent_prompts')
          .select('*')
          .in('agent_id', agentIds);

        // Map back to TypeScript Agent model
        const merged: Agent[] = dbAgents.map(a => {
          const cfgRow = dbConfigs?.find(c => c.agent_id === a.id);
          const promptRows = dbPrompts?.filter(p => p.agent_id === a.id) || [];

          const config: AgentConfig = cfgRow ? {
            id: cfgRow.id,
            agentId: a.id,
            version: cfgRow.version,
            temperature: Number(cfgRow.temperature ?? 0.7),
            maxTokens: cfgRow.max_tokens ?? 2048,
            topP: Number(cfgRow.top_p ?? 1.0),
            timeoutSeconds: cfgRow.timeout_seconds ?? 60,
            retryPolicy: cfgRow.retry_policy || { maxRetries: 2, backoffMs: 1500 },
            memoryMode: cfgRow.memory_mode || 'isolated',
            requiresHumanApproval: cfgRow.requires_human_approval ?? false,
            maxDailyExecutions: cfgRow.max_daily_executions ?? 100,
            executionTimeoutMs: cfgRow.execution_timeout_ms ?? 120000,
            metadata: cfgRow.metadata || {},
            createdAt: cfgRow.created_at
          } : {
            id: generateUUID(),
            agentId: a.id,
            version: a.version || 1,
            temperature: 0.7,
            maxTokens: 2048,
            topP: 1.0,
            timeoutSeconds: 60,
            retryPolicy: { maxRetries: 2, backoffMs: 1500 },
            memoryMode: 'isolated',
            requiresHumanApproval: false,
            maxDailyExecutions: 100,
            executionTimeoutMs: 120000,
            metadata: {},
            createdAt: a.created_at
          };

          const prompts: AgentPrompt[] = promptRows.map(p => ({
            id: p.id,
            agentId: a.id,
            promptType: p.prompt_type,
            currentVersion: p.current_version,
            content: p.content,
            updatedAt: p.updated_at
          }));

          return {
            id: a.id,
            name: a.name,
            slug: a.slug,
            description: a.description || '',
            icon: a.icon || 'bot',
            category: a.category || 'custom',
            tags: a.tags || [],
            status: a.status as AgentStatus,
            primaryProviderId: a.primary_provider_id || '',
            primaryModel: a.primary_model || '',
            version: a.version || 1,
            isTemplate: a.is_template ?? false,
            templateOrigin: a.template_origin,
            createdAt: a.created_at,
            updatedAt: a.updated_at,
            enabledToolsCount: 0,
            config,
            prompts: prompts.length > 0 ? prompts : [{
              id: generateUUID(),
              agentId: a.id,
              promptType: 'system',
              currentVersion: 1,
              content: 'You are an autonomous AI agent.',
              updatedAt: a.updated_at
            }]
          };
        });

        // Sync local storage mirror
        try {
          localStorage.setItem(LOCAL_STORAGE_AGENTS_KEY, JSON.stringify(merged));
        } catch (_) {}

        return merged;
      }
    } catch (e) {
      console.warn('[agentDatabaseService] Failed to load from Supabase cloud:', e);
    }
  }

  // 2. Try LocalStorage Cache
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_AGENTS_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (_) {}

  // 3. Fallback to Initial Seed Data
  try {
    localStorage.setItem(LOCAL_STORAGE_AGENTS_KEY, JSON.stringify(seedFallback));
  } catch (_) {}
  return seedFallback;
}

/**
 * Persist an agent creation across Supabase and local cache
 */
export async function persistAgentCreate(agent: Agent): Promise<void> {
  // 1. Write to Local Storage
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_AGENTS_KEY);
    const list: Agent[] = cached ? JSON.parse(cached) : [];
    const updated = [agent, ...list.filter(a => a.id !== agent.id)];
    localStorage.setItem(LOCAL_STORAGE_AGENTS_KEY, JSON.stringify(updated));
  } catch (_) {}

  // 2. Write to Supabase Cloud if configured
  if (isSupabaseConfigured && supabase) {
    try {
      // Insert agent
      await supabase.from('agents').upsert({
        id: agent.id,
        name: agent.name,
        slug: agent.slug,
        description: agent.description,
        icon: agent.icon,
        category: agent.category,
        tags: agent.tags,
        status: agent.status,
        primary_provider_id: agent.primaryProviderId || null,
        primary_model: agent.primaryModel,
        version: agent.version,
        is_template: agent.isTemplate,
        template_origin: agent.templateOrigin || null,
        created_at: agent.createdAt,
        updated_at: agent.updatedAt
      });

      // Insert config
      if (agent.config) {
        await supabase.from('agent_configs').upsert({
          id: agent.config.id || generateUUID(),
          agent_id: agent.id,
          version: agent.config.version || 1,
          temperature: agent.config.temperature,
          max_tokens: agent.config.maxTokens,
          top_p: agent.config.topP,
          timeout_seconds: agent.config.timeoutSeconds,
          retry_policy: agent.config.retryPolicy,
          memory_mode: agent.config.memoryMode,
          requires_human_approval: agent.config.requiresHumanApproval,
          max_daily_executions: agent.config.maxDailyExecutions,
          execution_timeout_ms: agent.config.executionTimeoutMs,
          metadata: agent.config.metadata,
          created_at: agent.config.createdAt
        });
      }

      // Insert prompt
      if (agent.prompts && agent.prompts[0]) {
        const p = agent.prompts[0];
        await supabase.from('agent_prompts').upsert({
          id: p.id || generateUUID(),
          agent_id: agent.id,
          prompt_type: p.promptType || 'system',
          current_version: p.currentVersion || 1,
          content: p.content,
          updated_at: p.updatedAt
        });
      }
    } catch (e) {
      console.warn('[agentDatabaseService] Cloud sync error on create:', e);
    }
  }
}

/**
 * Persist an agent update
 */
export async function persistAgentUpdate(id: string, updates: Partial<Agent>): Promise<void> {
  // 1. Local storage
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_AGENTS_KEY);
    if (cached) {
      const list: Agent[] = JSON.parse(cached);
      const updated = list.map(a => a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a);
      localStorage.setItem(LOCAL_STORAGE_AGENTS_KEY, JSON.stringify(updated));
    }
  } catch (_) {}

  // 2. Supabase Cloud
  if (isSupabaseConfigured && supabase) {
    try {
      const dbUpdates: any = { updated_at: new Date().toISOString() };
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.slug !== undefined) dbUpdates.slug = updates.slug;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.primaryModel !== undefined) dbUpdates.primary_model = updates.primaryModel;
      if (updates.version !== undefined) dbUpdates.version = updates.version;

      await supabase.from('agents').update(dbUpdates).eq('id', id);
    } catch (e) {
      console.warn('[agentDatabaseService] Cloud sync error on update:', e);
    }
  }
}

/**
 * Persist an agent deletion
 */
export async function persistAgentDelete(id: string): Promise<void> {
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_AGENTS_KEY);
    if (cached) {
      const list: Agent[] = JSON.parse(cached);
      localStorage.setItem(LOCAL_STORAGE_AGENTS_KEY, JSON.stringify(list.filter(a => a.id !== id)));
    }
  } catch (_) {}

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('agents').delete().eq('id', id);
    } catch (e) {
      console.warn('[agentDatabaseService] Cloud sync error on delete:', e);
    }
  }
}
