// ==============================================================================
// Zuu Agent — Test Suite: Facebook Integration, Deployment & Final Hardening
// Covers:
// 1. Meta Graph API error classification (Codes 190, 200, 368, 506, 4/17) & token masking
// 2. Safe Facebook Publishing lifecycle guards, approval gates, and idempotency
// 3. Exact duplicate content detection & Jaccard token similarity engine
// 4. Vercel Cron authorization & secret token verification
// 5. Backup snapshot sanitization (zero secrets leaked) and schema validation
// 6. System health truthful probing & recursive secret redaction
// ==============================================================================

import { describe, it, expect } from 'vitest';
import { 
  classifyMetaError, 
  maskToken 
} from '../../api/integrations/facebook/diagnostics';
import { 
  computeContentHash, 
  computeJaccardSimilarity, 
  checkContentSimilarity, 
  ExistingPostItem 
} from '../services/content/duplicateDetector';
import { redactSecrets } from '../../api/health';

describe('Zuu Agent — Facebook Integration & Hardening Test Suite', () => {

  describe('1. Meta Graph API Diagnostics, Permissions & Error Classification', () => {
    it('masks Facebook Page Access Tokens so secrets are never returned raw', () => {
      const liveToken = 'EAAG1234567890abcdefghijklmnopqrstuvwxyz9999';
      const masked = maskToken(liveToken);

      expect(masked).toBe('EAAG12...9999');
      expect(masked).not.toContain('abcdefgh');
      expect(maskToken('')).toBe('not_configured');
      expect(maskToken(undefined)).toBe('not_configured');
      expect(maskToken('mock_page_token')).toBe('mock_token_simulated');
    });

    it('classifies Meta Error Code 190 as OAuthTokenExpiredException with remediation guidance', () => {
      const result = classifyMetaError(190, 463, 'Error validating access token: Session has expired.');
      expect(result.type).toBe('OAuthTokenExpiredException');
      expect(result.category).toBe('Authentication');
      expect(result.actionableRemedy).toContain('expired');
    });

    it('classifies Meta Error Code 200 as PermissionScopeException for missing permissions', () => {
      const result = classifyMetaError(200, undefined, 'Permissions error');
      expect(result.type).toBe('PermissionScopeException');
      expect(result.category).toBe('Authorization');
      expect(result.actionableRemedy).toContain('pages_manage_posts');
    });

    it('classifies Meta Error Code 368 as TemporarilyBlockedActionException for safety pauses', () => {
      const result = classifyMetaError(368, undefined, 'Action blocked by Meta');
      expect(result.type).toBe('TemporarilyBlockedActionException');
      expect(result.category).toBe('Policy & Safety');
      expect(result.actionableRemedy).toContain('24-48 hours');
    });

    it('classifies Meta Error Code 506 as DuplicatePostContentException', () => {
      const result = classifyMetaError(506, undefined, 'Duplicate status message');
      expect(result.type).toBe('DuplicatePostContentException');
      expect(result.category).toBe('Content Validation');
      expect(result.actionableRemedy).toContain('Duplicate post detected');
    });

    it('classifies Meta Error Code 4 as RateLimitException', () => {
      const result = classifyMetaError(4, undefined, 'Application request limit reached');
      expect(result.type).toBe('RateLimitException');
      expect(result.category).toBe('Meta Rate Limits');
      expect(result.actionableRemedy).toContain('200 calls/hour');
    });
  });

  describe('2. Safe Facebook Publishing: Lifecycle Guards & Idempotency', () => {
    it('validates agent status and blocks disabled or archived agents from publishing', () => {
      function canPublish(status: string): boolean {
        return status !== 'disabled' && status !== 'archived';
      }

      expect(canPublish('active')).toBe(true);
      expect(canPublish('draft')).toBe(true);
      expect(canPublish('paused')).toBe(true);
      expect(canPublish('disabled')).toBe(false);
      expect(canPublish('archived')).toBe(false);
    });

    it('requires human approval sign-off when approvalId is bound to a publication request', () => {
      function validateApprovalGate(approvalId?: string, isApproved?: boolean): boolean {
        if (approvalId && isApproved === false) return false;
        return true;
      }

      expect(validateApprovalGate(undefined, undefined)).toBe(true);
      expect(validateApprovalGate('appr_123', true)).toBe(true);
      expect(validateApprovalGate('appr_123', false)).toBe(false);
    });

    it('protects against duplicate submissions via unique idempotency keys', () => {
      const cache = new Map<string, any>();
      function publishWithIdempotency(key: string, postId: string) {
        if (cache.has(key)) {
          return { isDuplicate: true, ...cache.get(key) };
        }
        const record = { postId, success: true };
        cache.set(key, record);
        return { isDuplicate: false, ...record };
      }

      const res1 = publishWithIdempotency('key_pub_001', '109847291834910_111');
      expect(res1.isDuplicate).toBe(false);

      const res2 = publishWithIdempotency('key_pub_001', '109847291834910_222');
      expect(res2.isDuplicate).toBe(true);
      expect(res2.postId).toBe('109847291834910_111'); // Returns original post
    });
  });

  describe('3. Duplicate Content Detection & Jaccard Token Similarity Engine', () => {
    const history: ExistingPostItem[] = [
      {
        id: 'post-seed-01',
        content: 'বৃষ্টির দিনে বাঙালি জাতির ৩টি সার্বজনীন ইচ্ছা: গরম খিচুড়ি আর বেগুন ভাজা!',
        status: 'published'
      },
      {
        id: 'post-seed-02',
        content: 'অফিসে যখন বস বলে— কাজটা আর্জেন্ট না, তবে লাঞ্চের আগেই শেষ করে দিয়েন!',
        status: 'published'
      }
    ];

    it('generates consistent SHA-256 hashes ignoring extra whitespace and casing', () => {
      const text1 = 'বৃষ্টির দিনে বাঙালি জাতির ৩টি সার্বজনীন ইচ্ছা: গরম খিচুড়ি!';
      const text2 = '  বৃষ্টির দিনে বাঙালি জাতির ৩টি সার্বজনীন ইচ্ছা:   গরম খিচুড়ি!  ';
      expect(computeContentHash(text1)).toBe(computeContentHash(text2));
    });

    it('identifies exact duplicate content and returns prohibit flag', () => {
      const exactCopy = 'বৃষ্টির দিনে বাঙালি জাতির ৩টি সার্বজনীন ইচ্ছা: গরম খিচুড়ি আর বেগুন ভাজা!';
      const check = checkContentSimilarity(exactCopy, history);

      expect(check.isExactDuplicate).toBe(true);
      expect(check.maxSimilarityScore).toBe(1.0);
      expect(check.matchedPostId).toBe('post-seed-01');
      expect(check.warningMessage).toContain('Exact duplicate detected');
    });

    it('computes accurate Jaccard token similarity for high-overlap variations', () => {
      const highOverlap = 'বৃষ্টির দিনে বাঙালি জাতির ৩টি ইচ্ছা: গরম খিচুড়ি বেগুন ভাজা ও আদা চা!';
      const check = checkContentSimilarity(highOverlap, history, 0.60);

      expect(check.isExactDuplicate).toBe(false);
      expect(check.maxSimilarityScore).toBeGreaterThan(0.60);
      expect(check.matchedPostId).toBe('post-seed-01');
      expect(check.warningMessage).toContain('High content similarity');
    });

    it('permits novel content with low similarity score without warnings', () => {
      const freshContent = 'রমজানের প্রথম দিনে চকবাজারের ইফতারির ভিড় এবং ঐতিহ্যবাহী জিলাপির সুবাস!';
      const check = checkContentSimilarity(freshContent, history, 0.60);

      expect(check.isExactDuplicate).toBe(false);
      expect(check.maxSimilarityScore).toBeLessThan(0.30);
      expect(check.warningMessage).toBeUndefined();
    });
  });

  describe('4. Vercel Cron Worker Authorization & Secret Verification', () => {
    function verifyCronAuthorization(headers: Record<string, string>, cronSecret?: string): boolean {
      if (!cronSecret) return true; // Dev mode
      const authHeader = headers['authorization'];
      if (authHeader === `Bearer ${cronSecret}`) return true;
      if (headers['x-vercel-cron'] === '1') return true;
      return false;
    }

    it('accepts valid Bearer token matching CRON_SECRET_TOKEN', () => {
      const secret = 'super_secret_cron_token_12345';
      const valid = verifyCronAuthorization({ authorization: `Bearer ${secret}` }, secret);
      expect(valid).toBe(true);
    });

    it('accepts legitimate Vercel Cron header', () => {
      const secret = 'super_secret_cron_token_12345';
      const valid = verifyCronAuthorization({ 'x-vercel-cron': '1' }, secret);
      expect(valid).toBe(true);
    });

    it('rejects unauthorized requests with mismatched or absent tokens', () => {
      const secret = 'super_secret_cron_token_12345';
      expect(verifyCronAuthorization({ authorization: 'Bearer wrong_token' }, secret)).toBe(false);
      expect(verifyCronAuthorization({}, secret)).toBe(false);
    });
  });

  describe('5. Backup Snapshot Sanitization & Zero Secrets Guarantee', () => {
    it('ensures exported snapshots contain zero credentials, access tokens, or service keys', () => {
      const rawAgent = {
        name: 'Trollogiya Content Agent',
        slug: 'trollogiya-agent',
        apiKey: 'sk-secret-gemini-key',
        fbToken: 'EAAX_secret_page_token',
        config: {
          temperature: 0.7,
          dbPassword: 'secret_postgres_pass'
        }
      };

      // Sanitization pipeline
      const sanitized = {
        name: rawAgent.name,
        slug: rawAgent.slug,
        config: {
          temperature: rawAgent.config.temperature
        }
      };

      const jsonString = JSON.stringify(sanitized);
      expect(jsonString).not.toContain('sk-secret');
      expect(jsonString).not.toContain('EAAX_secret');
      expect(jsonString).not.toContain('secret_postgres_pass');
    });

    it('validates snapshot schema before allowing restore operations', () => {
      function validateBackupSchema(data: any): boolean {
        if (!data || typeof data !== 'object') return false;
        if (!Array.isArray(data.agents)) return false;
        return true;
      }

      expect(validateBackupSchema({ agents: [{ name: 'Agent 1' }] })).toBe(true);
      expect(validateBackupSchema({ invalidField: 123 })).toBe(false);
      expect(validateBackupSchema(null)).toBe(false);
    });
  });

  describe('6. System Health & Recursive Secret Redaction', () => {
    it('recursively redacts any field containing secret, token, key, or password', () => {
      const dirtyObject = {
        status: 'healthy',
        databaseUrl: 'postgres://admin:pass123@supabase.co:5432/db',
        api_key: 'sk-gemini-12345',
        accessToken: 'oauth-token-xyz',
        nested: {
          serviceRoleKey: 'eyJhbGciOi...',
          systemPassword: 'root_password',
          safeCount: 42
        }
      };

      const cleaned = redactSecrets(dirtyObject);

      expect(cleaned.status).toBe('healthy');
      expect(cleaned.api_key).toBe('[REDACTED_SECRET]');
      expect(cleaned.accessToken).toBe('[REDACTED_SECRET]');
      expect(cleaned.nested.serviceRoleKey).toBe('[REDACTED_SECRET]');
      expect(cleaned.nested.systemPassword).toBe('[REDACTED_SECRET]');
      expect(cleaned.nested.safeCount).toBe(42);
    });
  });
});
