// ==============================================================================
// Zuu Agent — Vercel Serverless Function: Server-Side Meta Graph API Publisher
// Route: POST /api/integrations/meta-publish
// ==============================================================================

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { message, imageUrl, idempotencyKey, pageIdOverride, isDryRun } = req.body || {};

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Post message is required.' });
  }

  const serverToken = process.env.FB_PAGE_ACCESS_TOKEN;
  const serverPageId = pageIdOverride || process.env.FB_PAGE_ID || '109847291834910';
  const shouldSimulate = Boolean(isDryRun || !serverToken || serverToken.startsWith('mock_'));

  if (shouldSimulate) {
    const mockPostId = `${serverPageId}_${Date.now()}`;
    return res.status(200).json({
      success: true,
      postId: mockPostId,
      permalinkUrl: `https://www.facebook.com/${serverPageId}/posts/${mockPostId}`,
      isDryRun: true,
      idempotencyKey: idempotencyKey || `sim_${Date.now()}`
    });
  }

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

    const fbRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData)
    });

    const data = await fbRes.json();

    if (!fbRes.ok) {
      return res.status(fbRes.status).json({
        success: false,
        isDryRun: false,
        error: data?.error?.message || 'Meta Graph API Error',
        details: data?.error
      });
    }

    const postId = data.id || data.post_id;
    return res.status(200).json({
      success: true,
      postId,
      permalinkUrl: `https://www.facebook.com/${serverPageId}/posts/${postId}`,
      isDryRun: false,
      idempotencyKey
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Server error communicating with Meta Graph API'
    });
  }
}
