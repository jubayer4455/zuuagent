// ==============================================================================
// Zuu Agent — Vercel Serverless Function: Meta Facebook Webhook Verification & Listener
// Route: GET (verification) & POST (payload events) /api/webhooks/meta-facebook
// ==============================================================================

import crypto from 'crypto';

export default async function handler(req: any, res: any) {
  // 1. Meta Webhook Verification Challenge (GET)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const verifyToken = process.env.FB_WEBHOOK_VERIFY_TOKEN || 'zuu_meta_verify_token_2026';

    if (mode === 'subscribe' && token === verifyToken) {
      return res.status(200).send(challenge);
    } else {
      return res.status(403).json({ error: 'Verification token mismatch' });
    }
  }

  // 2. Incoming Meta Webhook Events (POST)
  if (req.method === 'POST') {
    const signature = req.headers['x-hub-signature-256'];
    const appSecret = process.env.FB_APP_SECRET;

    // Verify HMAC SHA-256 if secret configured
    if (appSecret && signature) {
      const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      const expectedSignature = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');

      if (signature !== expectedSignature) {
        return res.status(401).json({ error: 'Invalid HMAC webhook signature' });
      }
    }

    const payload = req.body;
    return res.status(200).json({
      received: true,
      entriesProcessed: payload?.entry?.length || 0
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
