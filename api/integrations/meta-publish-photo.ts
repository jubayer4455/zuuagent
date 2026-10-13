// ==============================================================================
// Zuu Agent — API: Meta Facebook Photo / Media Publishing Endpoint
// Route: POST /api/integrations/meta-publish-photo
// Implements official Graph API v21.0 /{page-id}/photos endpoint for publishing
// AI-generated images with captions to Facebook Pages, with idempotency & dry-run.
// ==============================================================================

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const processedPhotoKeys = new Set<string>();

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const {
    pageId = process.env.FACEBOOK_PAGE_ID || '109847291834910',
    caption = '',
    imageUrl = 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800',
    idempotencyKey,
    isDryRun = true
  } = req.body || {};

  if (!pageId || !caption) {
    return res.status(400).json({ error: 'pageId and caption are required for photo publishing.' });
  }

  // 1. Idempotency Check
  const effectiveKey = idempotencyKey || `photo_${crypto.createHash('md5').update(`${pageId}_${caption}`).digest('hex')}`;
  if (processedPhotoKeys.has(effectiveKey)) {
    return res.status(200).json({
      success: true,
      isDuplicatePrevented: true,
      message: 'Duplicate photo publication prevented via idempotency key.',
      idempotencyKey: effectiveKey
    });
  }

  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN || '';
  const startTime = Date.now();

  // If Dry Run or no live token configured
  if (isDryRun || !token || token.length < 20) {
    processedPhotoKeys.add(effectiveKey);
    const simulatedPhotoId = `photo_${pageId}_${Date.now()}`;

    return res.status(200).json({
      success: true,
      isDryRun: true,
      photoId: simulatedPhotoId,
      pageId,
      permalinkUrl: `https://www.facebook.com/${pageId}/photos/${simulatedPhotoId}`,
      caption,
      imageUrl,
      durationMs: Date.now() - startTime,
      message: 'Photo publication simulated successfully (Safe Dry-Run).'
    });
  }

  // Live Meta Graph API invocation: POST /{page-id}/photos
  try {
    const endpoint = `https://graph.facebook.com/v21.0/${pageId}/photos`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: imageUrl,
        caption: caption,
        access_token: token
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || `Meta Graph API Photo Error (${response.status})`);
    }

    processedPhotoKeys.add(effectiveKey);
    const photoId = data.id || data.post_id;

    return res.status(200).json({
      success: true,
      isDryRun: false,
      photoId,
      pageId,
      permalinkUrl: `https://www.facebook.com/${photoId}`,
      caption,
      imageUrl,
      durationMs: Date.now() - startTime,
      message: 'Photo published successfully to Facebook Page feed!'
    });
  } catch (err: any) {
    return res.status(502).json({
      success: false,
      error: err.message || 'Meta Graph API photo upload failed',
      pageId
    });
  }
}
