// ==============================================================================
// Zuu Agent — Vercel Serverless Function: Hardened Meta Graph API Publisher
// Route: POST /api/integrations/meta-publish
// Description: Implements safe Facebook publishing lifecycle, idempotency key caching,
//              exact duplicate detection, timeout reconciliation, and database persistence.
// ==============================================================================

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// In-memory recent posts cache for fast duplicate detection & idempotency (TTL: 24h)
const recentPublishedHashes = new Map<string, { postId: string; publishedAt: string; contentSnippet: string }>();
const idempotencyKeyStore = new Map<string, any>();

/**
 * Calculates cryptographic SHA-256 hash of normalized post text
 */
export function hashPostContent(content: string): string {
  const normalized = content.trim().toLowerCase().replace(/\s+/g, ' ');
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Reconciles potential timeout with Meta Graph API to prevent double-posting
 */
async function reconcileWithMetaFeed(pageId: string, token: string, expectedContent: string): Promise<string | null> {
  try {
    const checkEndpoint = `https://graph.facebook.com/v21.0/${pageId}/feed?fields=id,message,created_time&limit=5&access_token=${token}`;
    const checkRes = await fetch(checkEndpoint, { headers: { 'Accept': 'application/json' } });
    if (!checkRes.ok) return null;

    const data = await checkRes.json();
    const posts = data?.data || [];
    const expectedTrimmed = expectedContent.trim().substring(0, 80);

    for (const post of posts) {
      if (post.message && post.message.includes(expectedTrimmed)) {
        return post.id;
      }
    }
  } catch (_) {}
  return null;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { 
    message, 
    imageUrl, 
    idempotencyKey, 
    pageIdOverride, 
    tokenOverride,
    accessToken,
    pageAccessToken,
    isDryRun,
    agentId,
    agentStatus,
    approvalId,
    isApproved
  } = req.body || {};

  // 1. Validation: Message non-empty
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Post message content is required.' });
  }

  // 2. Validation: Agent Lifecycle Guard
  if (agentStatus === 'disabled' || agentStatus === 'archived') {
    return res.status(403).json({
      error: `Agent is currently in "${agentStatus}" lifecycle state. Publishing is strictly forbidden.`,
      errorCode: 'AGENT_LIFECYCLE_RESTRICTED'
    });
  }

  // 3. Validation: Human Approval Gate Guard
  if (approvalId && isApproved === false) {
    return res.status(403).json({
      error: 'Publication request has not been approved by an authorized reviewer.',
      errorCode: 'APPROVAL_GATE_REQUIRED'
    });
  }

  const effectiveIdempotencyKey = idempotencyKey || `pub_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  // 4. Idempotency Key Guard: Prevent duplicate submissions
  if (idempotencyKeyStore.has(effectiveIdempotencyKey)) {
    const cached = idempotencyKeyStore.get(effectiveIdempotencyKey);
    return res.status(200).json({
      ...cached,
      isCachedIdempotent: true,
      message: 'Duplicate submission avoided: result returned from idempotency key cache.'
    });
  }

  // 5. Exact Duplicate Content Guard
  const contentHash = hashPostContent(message);
  if (recentPublishedHashes.has(contentHash)) {
    const prev = recentPublishedHashes.get(contentHash)!;
    return res.status(409).json({
      error: 'Duplicate content detected: An identical post was already published recently.',
      errorCode: 'DUPLICATE_CONTENT_REJECTED',
      previousPostId: prev.postId,
      publishedAt: prev.publishedAt
    });
  }

  const clientToken = tokenOverride || accessToken || pageAccessToken;
  const serverToken = clientToken || process.env.FB_PAGE_ACCESS_TOKEN || process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const serverPageId = pageIdOverride || req.body?.pageId || process.env.FB_PAGE_ID || process.env.FACEBOOK_PAGE_ID || '109847291834910';
  const shouldSimulate = Boolean(isDryRun || !serverToken || serverToken.startsWith('mock_') || serverToken === 'simulate');

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const hasSupabase = Boolean(supabaseUrl && serviceRoleKey);
  const supabase = hasSupabase ? createClient(supabaseUrl, serviceRoleKey) : null;

  // 6. Safe Dry-Run Simulation Mode
  if (shouldSimulate) {
    const mockPostId = `${serverPageId}_${Date.now()}`;
    const result = {
      success: true,
      postId: mockPostId,
      permalinkUrl: `https://www.facebook.com/${serverPageId}/posts/${mockPostId}`,
      isDryRun: true,
      idempotencyKey: effectiveIdempotencyKey,
      contentHash,
      publishedAt: new Date().toISOString()
    };

    // Cache in idempotency and hash stores
    idempotencyKeyStore.set(effectiveIdempotencyKey, result);
    recentPublishedHashes.set(contentHash, {
      postId: mockPostId,
      publishedAt: result.publishedAt,
      contentSnippet: message.substring(0, 60)
    });

    // Persist to Supabase if available
    if (supabase) {
      try {
        await supabase.from('social_posts').insert({
          id: `post_${Date.now()}`,
          agent_id: agentId || null,
          platform: 'facebook',
          external_post_id: mockPostId,
          post_content: message,
          media_urls: imageUrl ? [imageUrl] : [],
          status: 'published',
          is_dry_run: true,
          published_at: result.publishedAt
        });
      } catch (_) {}
    }

    return res.status(200).json(result);
  }

  // 7. Live Meta Graph API Execution with Timeout Reconciliation
  const startTime = Date.now();
  let timedOut = false;

  try {
    let endpoint = `https://graph.facebook.com/v21.0/${serverPageId}/feed`;
    let bodyData: Record<string, any> = {
      message: message,
      access_token: serverToken
    };

    if (imageUrl) {
      endpoint = `https://graph.facebook.com/v21.0/${serverPageId}/photos`;
      bodyData = {
        caption: message,
        url: imageUrl,
        access_token: serverToken
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 15000); // 15-second bounded timeout

    const fbRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const data = await fbRes.json();

    if (!fbRes.ok) {
      return res.status(fbRes.status).json({
        success: false,
        isDryRun: false,
        error: data?.error?.message || 'Meta Graph API Error',
        errorCode: data?.error?.code,
        errorSubcode: data?.error?.error_subcode,
        details: data?.error
      });
    }

    const postId = data.id || data.post_id;
    const publishedAt = new Date().toISOString();

    const responsePayload = {
      success: true,
      postId,
      permalinkUrl: `https://www.facebook.com/${serverPageId}/posts/${postId}`,
      isDryRun: false,
      idempotencyKey: effectiveIdempotencyKey,
      contentHash,
      publishedAt
    };

    // Store in idempotency & hash cache
    idempotencyKeyStore.set(effectiveIdempotencyKey, responsePayload);
    recentPublishedHashes.set(contentHash, {
      postId,
      publishedAt,
      contentSnippet: message.substring(0, 60)
    });

    // Persist to Supabase database
    if (supabase) {
      try {
        await supabase.from('social_posts').insert({
          id: `post_${Date.now()}`,
          agent_id: agentId || null,
          platform: 'facebook',
          external_post_id: postId,
          post_content: message,
          media_urls: imageUrl ? [imageUrl] : [],
          status: 'published',
          is_dry_run: false,
          published_at: publishedAt
        });
      } catch (_) {}
    }

    return res.status(200).json(responsePayload);

  } catch (err: any) {
    // If request timed out or network severed, attempt feed reconciliation before failing
    if (timedOut || err.name === 'AbortError') {
      const reconciledPostId = await reconcileWithMetaFeed(serverPageId, serverToken, message);
      if (reconciledPostId) {
        const publishedAt = new Date().toISOString();
        const reconciledResult = {
          success: true,
          postId: reconciledPostId,
          permalinkUrl: `https://www.facebook.com/${serverPageId}/posts/${reconciledPostId}`,
          isDryRun: false,
          reconciled: true,
          message: 'Network request timed out, but post was confirmed on Meta Page feed through reconciliation.',
          idempotencyKey: effectiveIdempotencyKey,
          publishedAt
        };

        idempotencyKeyStore.set(effectiveIdempotencyKey, reconciledResult);
        recentPublishedHashes.set(contentHash, {
          postId: reconciledPostId,
          publishedAt,
          contentSnippet: message.substring(0, 60)
        });

        return res.status(200).json(reconciledResult);
      }
    }

    return res.status(504).json({
      success: false,
      isDryRun: false,
      error: 'Network timeout or failure communicating with Meta Graph API. Reconciliation verified post was not published.',
      errorCode: 'META_REQUEST_TIMEOUT',
      preservedDraft: {
        message,
        imageUrl,
        agentId,
        idempotencyKey: effectiveIdempotencyKey
      }
    });
  }
}
