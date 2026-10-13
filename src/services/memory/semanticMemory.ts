// ==============================================================================
// Zuu Agent — Semantic Memory & Anti-Repetition Duplicate Guard
// Computes token n-gram similarity and fingerprint hashes to guarantee
// agents never publish repetitive jokes, news, or customer replies.
// ==============================================================================

import crypto from 'crypto';

export interface MemoryRecord {
  id: string;
  agentId: string;
  content: string;
  fingerprint: string;
  category: 'social_post' | 'knowledge' | 'instruction';
  createdAt: string;
}

export class SemanticMemoryService {
  private static localMemoryStore: MemoryRecord[] = [];

  /**
   * Generates a deterministic content fingerprint
   */
  static generateFingerprint(text: string): string {
    const normalized = text.toLowerCase().replace(/[\s\p{P}]+/gu, '');
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  /**
   * Checks similarity between candidate text and existing memory entries.
   * Returns similarity percentage (0.0 to 1.0).
   */
  static checkSimilarity(candidate: string, agentId?: string): { isDuplicate: boolean; highestSimilarity: number; matchedMemory?: MemoryRecord } {
    const candidateTokens = this.tokenize(candidate);
    let highestSimilarity = 0;
    let matchedMemory: MemoryRecord | undefined = undefined;

    const filtered = agentId 
      ? this.localMemoryStore.filter(m => m.agentId === agentId)
      : this.localMemoryStore;

    for (const record of filtered) {
      // 1. Exact fingerprint match
      if (record.fingerprint === this.generateFingerprint(candidate)) {
        return { isDuplicate: true, highestSimilarity: 1.0, matchedMemory: record };
      }

      // 2. Token overlap similarity (Jaccard index)
      const recordTokens = this.tokenize(record.content);
      const similarity = this.calculateJaccardSimilarity(candidateTokens, recordTokens);

      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        matchedMemory = record;
      }
    }

    // Flag as duplicate if similarity > 75%
    const isDuplicate = highestSimilarity >= 0.75;
    return { isDuplicate, highestSimilarity, matchedMemory };
  }

  /**
   * Saves a new memory entry
   */
  static recordMemory(agentId: string, content: string, category: 'social_post' | 'knowledge' | 'instruction' = 'social_post'): MemoryRecord {
    const record: MemoryRecord = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      agentId,
      content,
      fingerprint: this.generateFingerprint(content),
      category,
      createdAt: new Date().toISOString()
    };

    this.localMemoryStore.push(record);
    return record;
  }

  private static tokenize(text: string): Set<string> {
    const words = text.toLowerCase().split(/[\s,.;!?।]+/);
    return new Set(words.filter(w => w.length > 2));
  }

  private static calculateJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
    if (setA.size === 0 || setB.size === 0) return 0;
    let intersection = 0;
    setA.forEach(item => {
      if (setB.has(item)) intersection++;
    });
    const union = new Set([...setA, ...setB]).size;
    return intersection / union;
  }
}
