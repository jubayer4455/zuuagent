import { describe, it, expect } from 'vitest';
import { ReActAgentEngine } from '../services/ai/reactAgentEngine';
import { SemanticMemoryService } from '../services/memory/semanticMemory';
import { SecretsVaultService } from '../services/security/secretsVault';

describe('Zuu Agent — Autonomous Engine Backend Suite (n8n Parity)', () => {
  describe('1. ReAct Autonomous Agent Loop', () => {
    it('executes multi-turn reasoning and tool invocation', async () => {
      const result = await ReActAgentEngine.execute(
        'বৃষ্টির দিনে ঢাকার ট্রাফিক জ্যাম',
        'You are Trollogiya, an elite Bengali social media humorist.'
      );

      expect(result).toBeDefined();
      expect(result.totalSteps).toBeGreaterThanOrEqual(2);
      expect(result.thoughtTrace.length).toBeGreaterThanOrEqual(2);
      expect(result.finalResponse).toContain('বৃষ্টি');
      expect(result.tokensUsed).toBeGreaterThan(0);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('2. Semantic Memory & Anti-Repetition Duplicate Guard', () => {
    it('detects duplicate posts and calculates token similarity', () => {
      const originalText = 'বৃষ্টির দিনে বাঙালি জাতির ৩টি সার্বজনীন ইচ্ছা: গরম খিচুড়ি আর বেগুন ভাজা!';
      SemanticMemoryService.recordMemory('agent-1', originalText, 'social_post');

      // Exact match check
      const exactCheck = SemanticMemoryService.checkSimilarity(originalText, 'agent-1');
      expect(exactCheck.isDuplicate).toBe(true);
      expect(exactCheck.highestSimilarity).toBe(1.0);

      // Completely different topic
      const differentText = 'Python এবং TypeScript দিয়ে আধুনিক মাইক্রোসার্ভিস আর্কিটেকচার ডিজাইন';
      const differentCheck = SemanticMemoryService.checkSimilarity(differentText, 'agent-1');
      expect(differentCheck.isDuplicate).toBe(false);
      expect(differentCheck.highestSimilarity).toBeLessThan(0.3);
    });
  });

  describe('3. AES-256-GCM Military Grade Encrypted Secrets Vault', () => {
    it('encrypts and successfully decrypts sensitive Facebook tokens and API keys', () => {
      const secretToken = 'EAABwzLixnjYBO78ZCRK2ZCZC9a...pageAccessToken123';
      const encrypted = SecretsVaultService.encrypt(secretToken);

      expect(encrypted.encryptedPayload).toBeDefined();
      expect(encrypted.encryptedPayload).toContain(':');
      expect(encrypted.fingerprint).toContain('EAABwz');

      // Decrypt
      const decrypted = SecretsVaultService.decrypt(encrypted.encryptedPayload);
      expect(decrypted).toBe(secretToken);
    });
  });
});
