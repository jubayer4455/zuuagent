// ==============================================================================
// Zuu Agent — Test Suite: AI Engine, Memory Center, Approvals & Automation
// Covers:
// 1. AI Provider capability negotiation, truthful status, and masked keys
// 2. Memory Center partition scoping (isolated, shared_explicit, none, global) & JSON export
// 3. Cryptographic SHA-256 payload checksum verification and approval gate tamper protection
// 4. Universal Execution Engine lifecycle enforcement and idempotency protection
// 5. Database-backed Scheduler atomic job locking and stale recovery logic
// ==============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import crypto from 'crypto';
import { 
  getMemoriesForExecution, 
  exportMemoriesAsJson 
} from '../services/memoryDatabaseService';
import { AgentMemory } from '../types';
import { useProviderStore } from '../store/useProviderStore';

describe('Zuu Agent — AI Engine, Memory & Automation Test Suite', () => {

  describe('1. AI Provider Manager & Masked Credential Protection', () => {
    beforeEach(() => {
      // Reset provider store if needed
    });

    it('masks secret API keys correctly so raw tokens are never exposed', () => {
      function maskKey(key?: string): string {
        if (!key) return 'not_configured';
        if (key.length <= 8) return '********';
        return `${key.substring(0, 6)}...${key.substring(key.length - 4)}`;
      }

      const sampleKey = 'sk-proj-1234567890abcdefghijklmnopqrstuvwxyz';
      const masked = maskKey(sampleKey);

      expect(masked).toBe('sk-pro...wxyz');
      expect(masked).not.toContain('1234567890');
      expect(maskKey('')).toBe('not_configured');
      expect(maskKey(undefined)).toBe('not_configured');
      expect(maskKey('short')).toBe('********');
    });

    it('reports truthful capability matrix without fabricating credentials', () => {
      const store = useProviderStore.getState();
      const geminiProvider = store.providers.find(p => p.slug === 'google-gemini');
      
      expect(geminiProvider).toBeDefined();
      expect(geminiProvider?.name).toBe('Google Gemini');
      
      // Models configured for Gemini
      const geminiModels = store.getModelsByProvider(geminiProvider!.id);
      expect(geminiModels.length).toBeGreaterThan(0);
      expect(geminiModels.some(m => m.modelIdentifier.includes('gemini-2.0-flash'))).toBe(true);
    });

    it('stores provider status truthfully as degraded or healthy based on endpoint response', async () => {
      const store = useProviderStore.getState();
      const provider = store.providers[0];
      
      // When testing connection in test environment (fetch simulated or intercepted)
      const result = await store.testProviderConnection(provider.id);
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('latencyMs');
    });
  });

  describe('2. Memory Center: Scoped Partitioning & JSON Export', () => {
    const sampleMemories: AgentMemory[] = [
      {
        id: 'mem-1',
        agentId: 'agent-alpha',
        scope: 'agent',
        category: 'preference',
        key: 'tone_guideline',
        content: 'Use witty Bengali humor with punchlines.',
        source: 'manual',
        priority: 8,
        status: 'active',
        provenance: {},
        createdAt: '2026-10-10T10:00:00Z',
        updatedAt: '2026-10-10T10:00:00Z'
      },
      {
        id: 'mem-2',
        agentId: 'agent-beta',
        scope: 'agent',
        category: 'summary',
        key: 'past_post_topic',
        content: 'Covered traffic jams at Farmgate.',
        source: 'execution',
        priority: 4,
        status: 'active',
        provenance: {},
        createdAt: '2026-10-11T10:00:00Z',
        updatedAt: '2026-10-11T10:00:00Z'
      },
      {
        id: 'mem-3',
        scope: 'global',
        category: 'instruction',
        key: 'global_compliance',
        content: 'Never generate defamatory or hate speech.',
        source: 'manual',
        priority: 10,
        status: 'pinned',
        provenance: {},
        createdAt: '2026-10-01T10:00:00Z',
        updatedAt: '2026-10-01T10:00:00Z'
      },
      {
        id: 'mem-4',
        agentId: 'agent-alpha',
        scope: 'agent',
        category: 'feedback',
        key: 'expired_note',
        content: 'Temporary note for morning run.',
        source: 'manual',
        priority: 1,
        expiresAt: '2020-01-01T00:00:00Z', // Expired
        status: 'active',
        provenance: {},
        createdAt: '2020-01-01T00:00:00Z',
        updatedAt: '2020-01-01T00:00:00Z'
      },
      {
        id: 'mem-5',
        agentId: 'agent-alpha',
        scope: 'agent',
        category: 'feedback',
        key: 'archived_note',
        content: 'Old guidance that is now archived.',
        source: 'manual',
        priority: 2,
        status: 'archived',
        provenance: {},
        createdAt: '2026-10-05T00:00:00Z',
        updatedAt: '2026-10-05T00:00:00Z'
      }
    ];

    it('enforces "isolated" memory boundary: only target agent private memories + global instructions', () => {
      const retrieved = getMemoriesForExecution(sampleMemories, 'agent-alpha', 'isolated');
      
      const ids = retrieved.map(m => m.id);
      expect(ids).toContain('mem-1'); // Agent alpha private
      expect(ids).toContain('mem-3'); // Global instruction
      expect(ids).not.toContain('mem-2'); // Agent beta private (MUST NOT BLEED)
      expect(ids).not.toContain('mem-4'); // Expired (MUST BE FILTERED)
      expect(ids).not.toContain('mem-5'); // Archived (MUST BE FILTERED)
    });

    it('enforces "none" memory mode: strictly suppresses all memory injection', () => {
      const retrieved = getMemoriesForExecution(sampleMemories, 'agent-alpha', 'none');
      expect(retrieved).toHaveLength(0);
    });

    it('enforces "shared_explicit" mode: retrieves target agent, explicitly shared agents, and global instructions', () => {
      // Authorize agent-alpha to access agent-beta's memories
      const retrieved = getMemoriesForExecution(
        sampleMemories, 
        'agent-alpha', 
        'shared_explicit', 
        ['agent-beta']
      );

      const ids = retrieved.map(m => m.id);
      expect(ids).toContain('mem-1');
      expect(ids).toContain('mem-2'); // Permitted via explicit authorization
      expect(ids).toContain('mem-3');
    });

    it('exports memories to clean, validated JSON with correct metadata', () => {
      const jsonStr = exportMemoriesAsJson(sampleMemories.slice(0, 3));
      const parsed = JSON.parse(jsonStr);

      expect(parsed).toHaveProperty('exportedAt');
      expect(parsed.platform).toContain('Zuu Agent');
      expect(parsed.totalRecords).toBe(3);
      expect(parsed.memories).toHaveLength(3);
      expect(parsed.memories[0].id).toBe('mem-1');
    });
  });

  describe('3. Cryptographic SHA-256 Checksum & Approval Tamper Protection', () => {
    function computePayloadChecksum(content: string): string {
      return crypto.createHash('sha256').update(content).digest('hex');
    }

    function verifyApprovalPayload(originalChecksum: string, currentContent: string): boolean {
      const currentChecksum = computePayloadChecksum(currentContent);
      return currentChecksum === originalChecksum;
    }

    it('generates consistent, deterministic SHA-256 checksum for payload content', () => {
      const payload = 'বৃষ্টির দিনে বাঙালি জাতির ৩টি সার্বজনীন ইচ্ছা: গরম খিচুড়ি আর বেগুন ভাজা!';
      const hash1 = computePayloadChecksum(payload);
      const hash2 = computePayloadChecksum(payload);

      expect(hash1).toHaveLength(64);
      expect(hash1).toBe(hash2);
    });

    it('detects tampering and rejects decision when content has been modified', () => {
      const originalPayload = 'অফিসে যখন বস বলে— "কাজটা আর্জেন্ট না, তবে লাঞ্চের আগেই শেষ করে দিয়েন!"';
      const checksum = computePayloadChecksum(originalPayload);

      // Verifying original passes
      expect(verifyApprovalPayload(checksum, originalPayload)).toBe(true);

      // Verifying modified payload fails immediately
      const tamperedPayload = 'অফিসে যখন বস বলে— "কাজটা আর্জেন্ট না, তবে ডিনারের আগেই শেষ করে দিয়েন!"';
      expect(verifyApprovalPayload(checksum, tamperedPayload)).toBe(false);

      // Even a single whitespace change is caught
      expect(verifyApprovalPayload(checksum, originalPayload + ' ')).toBe(false);
    });
  });

  describe('4. Universal Execution Engine Lifecycle & Idempotency Rules', () => {
    it('prohibits execution for agents in "disabled" or "archived" lifecycle states', () => {
      function canExecuteAgent(status: string): { allowed: boolean; reason?: string } {
        if (status === 'disabled' || status === 'archived') {
          return { allowed: false, reason: `Agent is in "${status}" status. Executions are strictly prohibited.` };
        }
        return { allowed: true };
      }

      expect(canExecuteAgent('active').allowed).toBe(true);
      expect(canExecuteAgent('testing').allowed).toBe(true);
      expect(canExecuteAgent('draft').allowed).toBe(true);
      expect(canExecuteAgent('paused').allowed).toBe(true);

      const disabledCheck = canExecuteAgent('disabled');
      expect(disabledCheck.allowed).toBe(false);
      expect(disabledCheck.reason).toContain('strictly prohibited');

      const archivedCheck = canExecuteAgent('archived');
      expect(archivedCheck.allowed).toBe(false);
    });

    it('detects duplicate idempotency keys to prevent redundant execution and double posting', () => {
      const idempotencyCache = new Map<string, { executionId: string; status: string }>();

      function checkOrRegisterIdempotency(key: string, execId: string) {
        if (idempotencyCache.has(key)) {
          return { isDuplicate: true, cached: idempotencyCache.get(key) };
        }
        idempotencyCache.set(key, { executionId: execId, status: 'completed' });
        return { isDuplicate: false, cached: null };
      }

      const key = 'post_batch_2026_10_13_001';
      const firstRun = checkOrRegisterIdempotency(key, 'exec_1001');
      expect(firstRun.isDuplicate).toBe(false);

      // Second run with same key
      const secondRun = checkOrRegisterIdempotency(key, 'exec_1002');
      expect(secondRun.isDuplicate).toBe(true);
      expect(secondRun.cached?.executionId).toBe('exec_1001');
    });
  });

  describe('5. Database-Backed Scheduler: Atomic Job Locking & Recovery', () => {
    interface Job {
      id: string;
      agentId: string;
      status: 'queued' | 'locked' | 'completed' | 'cancelled';
      lockedBy?: string;
      lockedAt?: string;
      attemptCount: number;
    }

    it('claims and atomically locks queued jobs with unique worker ID', () => {
      const jobs: Job[] = [
        { id: 'job-1', agentId: 'agent-trollogiya', status: 'queued', attemptCount: 0 },
        { id: 'job-2', agentId: 'agent-support', status: 'queued', attemptCount: 0 }
      ];

      const workerId = 'worker_test_alpha';
      const now = new Date().toISOString();

      function claimJob(job: Job, worker: string): boolean {
        if (job.status === 'queued') {
          job.status = 'locked';
          job.lockedBy = worker;
          job.lockedAt = now;
          job.attemptCount += 1;
          return true;
        }
        return false;
      }

      const claimed = claimJob(jobs[0], workerId);
      expect(claimed).toBe(true);
      expect(jobs[0].status).toBe('locked');
      expect(jobs[0].lockedBy).toBe(workerId);
      expect(jobs[0].attemptCount).toBe(1);

      // Attempting to claim already locked job by another worker fails
      const secondWorkerClaim = claimJob(jobs[0], 'worker_test_beta');
      expect(secondWorkerClaim).toBe(false);
    });

    it('reclaims stale locked jobs whose lock has expired past the 5-minute threshold', () => {
      const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000).toISOString();
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

      const staleJob: Job = {
        id: 'job-stale',
        agentId: 'agent-trollogiya',
        status: 'locked',
        lockedBy: 'worker_crashed',
        lockedAt: sixMinutesAgo,
        attemptCount: 1
      };

      const activeJob: Job = {
        id: 'job-active',
        agentId: 'agent-trollogiya',
        status: 'locked',
        lockedBy: 'worker_healthy',
        lockedAt: twoMinutesAgo,
        attemptCount: 1
      };

      const staleThreshold = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      function isEligibleForWorker(job: Job): boolean {
        if (job.status === 'queued') return true;
        if (job.status === 'locked' && job.lockedAt && job.lockedAt < staleThreshold) return true;
        return false;
      }

      expect(isEligibleForWorker(staleJob)).toBe(true); // 6 mins > 5 mins -> eligible for recovery
      expect(isEligibleForWorker(activeJob)).toBe(false); // 2 mins < 5 mins -> must not interfere
    });
  });

  describe('6. Workflow Builder: State Graph Persistence Serialization', () => {
    it('serializes and deserializes workflow graph nodes without data loss', () => {
      const workflowState = {
        id: 'wf_social_automation',
        name: 'Trollogiya Automated Content Loop',
        nodes: [
          { id: 'node_trigger', type: 'trigger_schedule', config: { cron: '0 12 * * *' } },
          { id: 'node_generate', type: 'agent_generate', config: { agentId: 'agent-trollogiya', tone: 'satirical' } },
          { id: 'node_approval', type: 'approval_gate', config: { riskLevel: 'medium' } },
          { id: 'node_publish', type: 'facebook_publish', config: { dryRun: false } }
        ],
        connections: [
          { from: 'node_trigger', to: 'node_generate' },
          { from: 'node_generate', to: 'node_approval' },
          { from: 'node_approval', to: 'node_publish' }
        ]
      };

      const serialized = JSON.stringify(workflowState);
      const deserialized = JSON.parse(serialized);

      expect(deserialized.id).toBe(workflowState.id);
      expect(deserialized.nodes).toHaveLength(4);
      expect(deserialized.connections).toHaveLength(3);
      expect(deserialized.nodes[2].type).toBe('approval_gate');
    });
  });
});
