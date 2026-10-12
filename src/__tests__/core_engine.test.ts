import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../store/useAuthStore';
import { useAgentStore } from '../store/useAgentStore';
import { useExecutionStore } from '../store/useExecutionStore';
import { useApprovalStore } from '../store/useApprovalStore';
import { useMemoryStore } from '../store/useMemoryStore';
import { MetaGraphClient } from '../services/facebook/metaGraphClient';
import { AgentRuntimeEngine } from '../services/engine/agentRuntimeEngine';
import { ToolExecutor } from '../services/tools/toolExecutor';

describe('Zuu Agent Universal Multi-Agent Platform Test Suite', () => {
  beforeEach(() => {
    // Reset stores to default state
    useAuthStore.getState().setCurrentRole('master_admin');
  });

  describe('1. RBAC Authentication & Role Enforcement', () => {
    it('grants full permissions to master_admin', () => {
      const auth = useAuthStore.getState();
      auth.setCurrentRole('master_admin');
      expect(auth.hasPermission('agents.create')).toBe(true);
      expect(auth.hasPermission('secrets.manage')).toBe(true);
      expect(auth.hasPermission('publishing.execute')).toBe(true);
      expect(auth.hasPermission('approvals.decide')).toBe(true);
    });

    it('enforces least-privilege restrictions for viewer role', () => {
      const auth = useAuthStore.getState();
      auth.setCurrentRole('viewer');
      expect(auth.hasPermission('agents.create')).toBe(false);
      expect(auth.hasPermission('secrets.manage')).toBe(false);
      expect(auth.hasPermission('publishing.execute')).toBe(false);
      expect(auth.hasPermission('data.export')).toBe(true); // Viewer can export viewable data
    });

    it('grants approval decisions to reviewer but denies agent creation', () => {
      const auth = useAuthStore.getState();
      auth.setCurrentRole('reviewer');
      expect(auth.hasPermission('approvals.decide')).toBe(true);
      expect(auth.hasPermission('agents.create')).toBe(false);
    });
  });

  describe('2. Agent Creation, Lifecycles & Safe Duplication', () => {
    it('creates an independent agent with isolated config', () => {
      const agentStore = useAgentStore.getState();
      const newAgent = agentStore.createAgent(
        {
          name: 'Independent Research Agent',
          category: 'research',
          primaryModel: 'gemini-2.0-flash'
        },
        {
          temperature: 0.3,
          memoryMode: 'isolated'
        },
        'You are an independent researcher.'
      );

      expect(newAgent.id).toBeDefined();
      expect(newAgent.name).toBe('Independent Research Agent');
      expect(newAgent.status).toBe('draft');
      expect(newAgent.config?.memoryMode).toBe('isolated');
    });

    it('safely duplicates an agent with separate UUID and independent draft status without leaking private state', () => {
      const agentStore = useAgentStore.getState();
      const trollogiya = agentStore.agents.find(a => a.slug.includes('trollogiya'));
      expect(trollogiya).toBeDefined();

      const duplicated = agentStore.duplicateAgent(trollogiya!.id);
      expect(duplicated).not.toBeNull();
      expect(duplicated!.id).not.toBe(trollogiya!.id);
      expect(duplicated!.status).toBe('draft'); // Safely starts as draft
      expect(duplicated!.name).toContain('(Copy)');
    });
  });

  describe('3. Memory Scoping & Boundary Isolation', () => {
    it('retrieves isolated memories only for designated agent plus approved global scope', () => {
      const memStore = useMemoryStore.getState();
      const trollogiyaId = '33333333-3333-3333-3333-333333333301';

      // Add private memory for trollogiya
      memStore.addMemory({
        agentId: trollogiyaId,
        scope: 'agent',
        key: 'test_troll_secret',
        content: 'Exclusive Trollogiya joke nuance'
      });

      // Add private memory for another agent
      memStore.addMemory({
        agentId: 'other-agent-999',
        scope: 'agent',
        key: 'other_secret',
        content: 'Customer Support private customer data'
      });

      const retrieved = memStore.getMemoriesByAgent(trollogiyaId);
      const keys = retrieved.map(m => m.key);

      expect(keys).toContain('test_troll_secret');
      expect(keys).not.toContain('other_secret'); // Cross-agent memory leak prevented!
    });
  });

  describe('4. Meta Graph API Facebook Publishing & Idempotency', () => {
    it('successfully processes dry-run Facebook publishing with simulated post ID', async () => {
      const idempotencyKey = `idemp_test_${Date.now()}`;
      const result = await MetaGraphClient.publishToPage({
        pageId: '109847291834910',
        message: 'বৃষ্টি আর যানজটের অম্লমধুর প্রেম! ☔️',
        idempotencyKey,
        isDryRun: true
      });

      expect(result.success).toBe(true);
      expect(result.isDryRun).toBe(true);
      expect(result.postId).toBeDefined();
    });

    it('prevents duplicate publications when identical idempotency key is submitted', async () => {
      const idempotencyKey = `idemp_duplicate_test_${Date.now()}`;

      // First run
      const res1 = await MetaGraphClient.publishToPage({
        pageId: '109847291834910',
        message: 'First post attempt',
        idempotencyKey,
        isDryRun: true
      });

      // Second run with same idempotency key
      const res2 = await MetaGraphClient.publishToPage({
        pageId: '109847291834910',
        message: 'Duplicate attempt with same key',
        idempotencyKey,
        isDryRun: true
      });

      expect(res2.postId).toBe(res1.postId);
      expect(res2.errorDetails?.note).toContain('Duplicate publication prevented');
    });
  });

  describe('5. Tool Registry & Side-Effect Execution', () => {
    it('executes Bengali content enhancer tool and appends punchline & hashtags', async () => {
      const result = await ToolExecutor.execute({
        toolName: 'bengali_content_enhancer',
        arguments: { draft: 'অফিসের কাজ শেষ করে বাড়ি ফেরার আনন্দ!', humorLevel: 9 },
        agentId: '33333333-3333-3333-3333-333333333301',
        isDryRun: true
      });

      expect(result.success).toBe(true);
      expect(result.output.enhancedContent).toContain('ট্রললজিয়া');
      expect(result.output.suggestedHashtags).toContain('#Trollogiya');
    });

    it('rejects execution for unregistered tools', async () => {
      const result = await ToolExecutor.execute({
        toolName: 'unregistered_dangerous_tool',
        arguments: {},
        agentId: 'agent-1',
        isDryRun: true
      });

      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('Unrecognized or unregistered tool');
    });
  });

  describe('6. Reusable Agent Runtime Engine Pipeline & Approval Gate', () => {
    it('enforces approval gate for agents with requiresHumanApproval=true', async () => {
      const agentStore = useAgentStore.getState();
      const trollogiya = agentStore.agents.find(a => a.slug.includes('trollogiya'))!;

      const result = await AgentRuntimeEngine.executeAgent({
        agent: trollogiya,
        taskPrompt: 'Create an engaging evening post about Dhaka adda',
        isDryRun: true
      });

      expect(result.requiresApproval).toBe(true);
      expect(result.execution.status).toBe('awaiting_approval');
      expect(result.approvalItem).toBeDefined();
      expect(result.approvalItem.targetDestination).toContain('Facebook Page');
    });

    it('aborts execution when agent status is disabled', async () => {
      const disabledAgent: any = {
        id: 'disabled-agent-01',
        name: 'Disabled Agent',
        status: 'disabled',
        version: 1
      };

      const result = await AgentRuntimeEngine.executeAgent({
        agent: disabledAgent,
        taskPrompt: 'Should fail immediately',
        isDryRun: true
      });

      expect(result.execution.status).toBe('failed');
      expect(result.execution.errorCode).toBe('AGENT_DISABLED');
    });
  });
});
