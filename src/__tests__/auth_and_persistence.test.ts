// ==============================================================================
// Zuu Agent — Foundation Test Suite: Auth, Persistence, Multi-Agent & Lifecycle
// ==============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { useAgentStore } from '../store/useAgentStore';
import { useAuthStore } from '../store/useAuthStore';
import { 
  isValidLifecycleTransition, 
  generateUUID, 
  VALID_LIFECYCLE_TRANSITIONS 
} from '../services/agentDatabaseService';
import { AgentStatus, UserRole } from '../types';

describe('Zuu Agent — Foundation & Multi-Agent Management Engine', () => {
  beforeEach(() => {
    // Reset stores
    useAgentStore.setState({
      agents: [],
      selectedAgentId: null,
      promptVersions: []
    });
  });

  describe('1. UUID Generation & RFC 4122 Compliance', () => {
    it('generates a valid 36-character UUID string', () => {
      const uuid = generateUUID();
      expect(uuid).toHaveLength(36);
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('generates unique UUIDs across consecutive invocations', () => {
      const u1 = generateUUID();
      const u2 = generateUUID();
      const u3 = generateUUID();
      expect(u1).not.toBe(u2);
      expect(u2).not.toBe(u3);
      expect(u1).not.toBe(u3);
    });
  });

  describe('2. Agent CRUD & Configuration Persistence', () => {
    it('creates an agent with valid UUID, default config, and system prompt', () => {
      const store = useAgentStore.getState();
      const created = store.createAgent(
        {
          name: 'Bengali Research Bot',
          slug: 'bengali-research-bot',
          category: 'research',
          status: 'draft'
        },
        {
          temperature: 0.4,
          maxTokens: 4096,
          memoryMode: 'isolated'
        },
        'You are an investigative Bengali research scout.'
      );

      expect(created.id).toHaveLength(36);
      expect(created.name).toBe('Bengali Research Bot');
      expect(created.status).toBe('draft');
      expect(created.config?.temperature).toBe(0.4);
      expect(created.config?.memoryMode).toBe('isolated');
      expect(created.prompts?.[0]?.content).toBe('You are an investigative Bengali research scout.');

      const inStore = useAgentStore.getState().getAgentById(created.id);
      expect(inStore).toBeDefined();
      expect(inStore?.name).toBe('Bengali Research Bot');
    });

    it('updates agent metadata and records updated timestamps', () => {
      const store = useAgentStore.getState();
      const agent = store.createAgent({ name: 'Initial Name' });

      store.updateAgent(agent.id, {
        name: 'Updated Agent Name',
        description: 'New Description for test'
      });

      const updated = useAgentStore.getState().getAgentById(agent.id);
      expect(updated?.name).toBe('Updated Agent Name');
      expect(updated?.description).toBe('New Description for test');
    });

    it('increments version and preserves version history on prompt update', () => {
      const store = useAgentStore.getState();
      const agent = store.createAgent({ name: 'Prompt Test Agent' });

      expect(agent.prompts?.[0]?.currentVersion).toBe(1);

      store.updateAgentPrompt(agent.id, 'Version 2 updated system prompt', 'Refined Bengali humor guidelines');

      const afterUpdate = useAgentStore.getState().getAgentById(agent.id);
      expect(afterUpdate?.prompts?.[0]?.currentVersion).toBe(2);
      expect(afterUpdate?.prompts?.[0]?.content).toBe('Version 2 updated system prompt');

      const history = useAgentStore.getState().promptVersions.filter(pv => pv.agentId === agent.id);
      expect(history.length).toBeGreaterThanOrEqual(1);
      expect(history[0].changeSummary).toBe('Refined Bengali humor guidelines');
    });

    it('supports configuration rollback to earlier version number', () => {
      const store = useAgentStore.getState();
      const agent = store.createAgent({ name: 'Rollback Test Agent' });

      store.updateAgentConfig(agent.id, { temperature: 0.9 });
      const v2 = useAgentStore.getState().getAgentById(agent.id);
      expect(v2?.version).toBe(2);

      store.rollbackConfig(agent.id, 1);
      const rolledBack = useAgentStore.getState().getAgentById(agent.id);
      expect(rolledBack?.config?.version).toBe(1);
    });
  });

  describe('3. Multiple Agent Isolation & Namespace Independence', () => {
    it('creates multiple agents with strictly disjoint IDs, memory modes, and tools', () => {
      const store = useAgentStore.getState();

      const agentA = store.createAgent(
        { name: 'Support Agent', category: 'customer_support', status: 'active', enabledToolsCount: 1 },
        { temperature: 0.2, memoryMode: 'none', requiresHumanApproval: false }
      );

      const agentB = store.createAgent(
        { name: 'Trollogiya Poster', category: 'facebook_publishing', status: 'draft', enabledToolsCount: 3 },
        { temperature: 0.85, memoryMode: 'isolated', requiresHumanApproval: true }
      );

      expect(agentA.id).not.toBe(agentB.id);
      expect(agentA.config?.id).not.toBe(agentB.config?.id);
      expect(agentA.config?.memoryMode).toBe('none');
      expect(agentB.config?.memoryMode).toBe('isolated');
      expect(agentA.config?.requiresHumanApproval).toBe(false);
      expect(agentB.config?.requiresHumanApproval).toBe(true);
      expect(agentA.status).toBe('active');
      expect(agentB.status).toBe('draft');
      expect(agentA.enabledToolsCount).toBe(1);
      expect(agentB.enabledToolsCount).toBe(3);

      // Verify changing agent A does NOT affect agent B
      store.updateAgent(agentA.id, { name: 'Support Agent Modified' });
      expect(useAgentStore.getState().getAgentById(agentA.id)?.name).toBe('Support Agent Modified');
      expect(useAgentStore.getState().getAgentById(agentB.id)?.name).toBe('Trollogiya Poster');
    });
  });

  describe('4. Lifecycle State Machine Validation', () => {
    it('allows valid lifecycle transitions', () => {
      expect(isValidLifecycleTransition('draft', 'active')).toBe(true);
      expect(isValidLifecycleTransition('draft', 'testing')).toBe(true);
      expect(isValidLifecycleTransition('active', 'paused')).toBe(true);
      expect(isValidLifecycleTransition('paused', 'active')).toBe(true);
      expect(isValidLifecycleTransition('active', 'error')).toBe(true);
      expect(isValidLifecycleTransition('error', 'draft')).toBe(true);
      expect(isValidLifecycleTransition('archived', 'draft')).toBe(true);
    });

    it('rejects invalid lifecycle transitions', () => {
      expect(isValidLifecycleTransition('archived', 'active')).toBe(false);
      expect(isValidLifecycleTransition('disabled', 'error')).toBe(false);
    });

    it('enforces transition rules in store with explicit error message', () => {
      const store = useAgentStore.getState();
      const agent = store.createAgent({ name: 'Lifecycle Agent', status: 'draft' });

      // Valid: draft -> active
      const res1 = store.setAgentStatus(agent.id, 'active');
      expect(res1.success).toBe(true);
      expect(useAgentStore.getState().getAgentById(agent.id)?.status).toBe('active');

      // Valid: active -> paused
      const res2 = store.setAgentStatus(agent.id, 'paused');
      expect(res2.success).toBe(true);
      expect(useAgentStore.getState().getAgentById(agent.id)?.status).toBe('paused');

      // Valid: paused -> archived
      const res3 = store.setAgentStatus(agent.id, 'archived');
      expect(res3.success).toBe(true);
      expect(useAgentStore.getState().getAgentById(agent.id)?.status).toBe('archived');

      // Invalid: archived -> active directly
      const res4 = store.setAgentStatus(agent.id, 'active');
      expect(res4.success).toBe(false);
      expect(res4.error).toContain('Invalid lifecycle transition');
      expect(useAgentStore.getState().getAgentById(agent.id)?.status).toBe('archived');
    });
  });

  describe('5. Agent Duplication & Security Scrubbing', () => {
    it('duplicates agent safely with new UUID, draft status, and scrubbed credentials', () => {
      const store = useAgentStore.getState();
      const original = store.createAgent(
        {
          name: 'Viral Publisher Original',
          slug: 'viral-publisher',
          status: 'active'
        },
        {
          metadata: {
            selectedPageId: '109847291834910',
            pageAccessToken: 'SECRET_PAGE_ACCESS_TOKEN_DO_NOT_LEAK',
            apiSecret: 'SECRET_API_KEY'
          } as any
        }
      );

      const duplicate = store.duplicateAgent(original.id, 'Viral Publisher Cloned');
      expect(duplicate).not.toBeNull();
      if (!duplicate) return;

      expect(duplicate.id).not.toBe(original.id);
      expect(duplicate.id).toHaveLength(36);
      expect(duplicate.name).toBe('Viral Publisher Cloned');
      expect(duplicate.status).toBe('draft');
      expect(duplicate.slug).toContain('viral-publisher-copy-');
      expect(duplicate.version).toBe(1);

      // Verify private credentials were scrubbed
      expect((duplicate.config?.metadata as any)?.pageAccessToken).toBeUndefined();
      expect((duplicate.config?.metadata as any)?.apiSecret).toBeUndefined();
      // Non-sensitive metadata retained
      expect((duplicate.config?.metadata as any)?.selectedPageId).toBe('109847291834910');
    });
  });

  describe('6. Role-Based Access Control (RBAC) Permissions', () => {
    it('grants master_admin full administrative and destructive permissions', () => {
      const auth = useAuthStore.getState();
      auth.setCurrentRole('master_admin');

      expect(auth.hasPermission('agents.create')).toBe(true);
      expect(auth.hasPermission('agents.delete')).toBe(true);
      expect(auth.hasPermission('secrets.manage')).toBe(true);
      expect(auth.hasPermission('users.manage')).toBe(true);
      expect(auth.hasPermission('approvals.decide')).toBe(true);
    });

    it('restricts operator to execution and read-only without administrative mutations', () => {
      const auth = useAuthStore.getState();
      auth.setCurrentRole('operator');

      expect(auth.hasPermission('agents.execute')).toBe(true);
      expect(auth.hasPermission('memory.manage')).toBe(true);
      expect(auth.hasPermission('agents.create')).toBe(false);
      expect(auth.hasPermission('agents.delete')).toBe(false);
      expect(auth.hasPermission('secrets.manage')).toBe(false);
      expect(auth.hasPermission('users.manage')).toBe(false);
    });

    it('restricts viewer to export only', () => {
      const auth = useAuthStore.getState();
      auth.setCurrentRole('viewer');

      expect(auth.hasPermission('data.export')).toBe(true);
      expect(auth.hasPermission('agents.execute')).toBe(false);
      expect(auth.hasPermission('agents.create')).toBe(false);
      expect(auth.hasPermission('approvals.decide')).toBe(false);
    });
  });
});
