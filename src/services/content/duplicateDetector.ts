// ==============================================================================
// Zuu Agent — Duplicate Content & Similarity Detection Engine
// Detects exact duplicate posts and computes semantic token similarity (Jaccard)
// to prevent publishing repetitive satire, jokes, or status updates to Facebook.
// ==============================================================================

export interface SimilarityResult {
  isExactDuplicate: boolean;
  maxSimilarityScore: number; // 0.0 to 1.0 (0% to 100%)
  matchedPostId?: string;
  matchedContentSnippet?: string;
  warningMessage?: string;
}

export interface ExistingPostItem {
  id: string;
  content: string;
  publishedAt?: string;
  status: string;
}

/**
 * Normalizes text by removing punctuation, extra spaces, and converting to lowercase
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'।]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Computes deterministic digest of normalized content (Browser & Node.js resilient)
 */
export function computeContentHash(text: string): string {
  const normalized = normalizeText(text);

  // 1. Try Node.js crypto if available
  try {
    if (typeof crypto !== 'undefined' && typeof (crypto as any).createHash === 'function') {
      return (crypto as any).createHash('sha256').update(normalized).digest('hex');
    }
  } catch (_) {}

  // 2. Pure deterministic hash fallback (DJB2 + FNV-1a) for browser runtime
  let h1 = 0xdeadbeef, h2 = 0x41c64e6d;
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

/**
 * Extracts unique word tokens from text
 */
function tokenize(text: string): Set<string> {
  const words = normalizeText(text).split(' ').filter(w => w.length > 1);
  return new Set(words);
}

/**
 * Computes Jaccard token similarity coefficient between two strings (0.0 to 1.0)
 * |Intersection(A, B)| / |Union(A, B)|
 */
export function computeJaccardSimilarity(textA: string, textB: string): number {
  const tokensA = tokenize(textA);
  const tokensB = tokenize(textB);

  if (tokensA.size === 0 && tokensB.size === 0) return 1.0;
  if (tokensA.size === 0 || tokensB.size === 0) return 0.0;

  let intersectionCount = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) {
      intersectionCount++;
    }
  }

  const unionCount = tokensA.size + tokensB.size - intersectionCount;
  if (unionCount === 0) return 0.0;

  return Number((intersectionCount / unionCount).toFixed(4));
}

/**
 * Compares new content against recent post history with configurable threshold
 */
export function checkContentSimilarity(
  newContent: string,
  existingPosts: ExistingPostItem[],
  similarityThreshold = 0.70 // 70% similarity threshold
): SimilarityResult {
  const newHash = computeContentHash(newContent);
  let maxScore = 0.0;
  let bestMatch: ExistingPostItem | null = null;

  for (const post of existingPosts) {
    // 1. Exact duplicate check via hash
    const existingHash = computeContentHash(post.content);
    if (newHash === existingHash) {
      return {
        isExactDuplicate: true,
        maxSimilarityScore: 1.0,
        matchedPostId: post.id,
        matchedContentSnippet: post.content.substring(0, 80),
        warningMessage: `Exact duplicate detected: An identical post exists in history (${post.id}). Duplicate publishing is prohibited.`
      };
    }

    // 2. Token similarity check
    const score = computeJaccardSimilarity(newContent, post.content);
    if (score > maxScore) {
      maxScore = score;
      bestMatch = post;
    }
  }

  if (maxScore >= similarityThreshold && bestMatch) {
    const percent = Math.round(maxScore * 100);
    return {
      isExactDuplicate: false,
      maxSimilarityScore: maxScore,
      matchedPostId: bestMatch.id,
      matchedContentSnippet: bestMatch.content.substring(0, 80),
      warningMessage: `High content similarity (${percent}%): This draft shares significant vocabulary with an earlier post (${bestMatch.id}). Consider revising punchlines.`
    };
  }

  return {
    isExactDuplicate: false,
    maxSimilarityScore: maxScore
  };
}
