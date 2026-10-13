// ==============================================================================
// Zuu Agent — Auto Page Discovery Endpoint
// Route: GET or POST /api/integrations/facebook/pages
// Discovers all Facebook Pages managed by the authenticated user account,
// providing page names, IDs, categories, and page access tokens.
// ==============================================================================

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use GET or POST.' });
  }

  const { tokenOverride } = (req.method === 'POST' ? req.body : req.query) || {};
  const effectiveToken = tokenOverride || process.env.FB_PAGE_ACCESS_TOKEN || '';

  const isSimulated = Boolean(!effectiveToken || effectiveToken.startsWith('mock_') || effectiveToken === 'simulate');

  // 1. Simulation / Fallback Data
  if (isSimulated) {
    return res.status(200).json({
      success: true,
      isSimulated: true,
      count: 2,
      pages: [
        {
          id: '109847291834910',
          name: 'Trollogiya Official Facebook Page',
          category: 'Entertainment & Satire Media',
          tasks: ['MANAGE', 'CREATE_CONTENT', 'MODERATE', 'ANALYZE'],
          accessToken: 'mock_permanent_page_token_trollogiya',
          isDefault: true
        },
        {
          id: '208394819284711',
          name: 'Zuu Agent Tech Labs',
          category: 'Software & Technology',
          tasks: ['MANAGE', 'CREATE_CONTENT'],
          accessToken: 'mock_permanent_page_token_zuulabs',
          isDefault: false
        }
      ]
    });
  }

  // 2. Live Meta Graph API Probe: GET /me/accounts
  try {
    const url = `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,category,access_token,picture&access_token=${effectiveToken}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error?.message || 'Failed to fetch accounts from Meta Graph API.');
    }

    const pages = (data.data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      tasks: p.tasks || [],
      accessToken: p.access_token,
      pictureUrl: p.picture?.data?.url
    }));

    return res.status(200).json({
      success: true,
      isSimulated: false,
      count: pages.length,
      pages
    });
  } catch (err: any) {
    return res.status(502).json({
      success: false,
      error: err.message || 'Meta accounts discovery failed'
    });
  }
}
