// ==============================================================================
// Zuu Agent — Meta Facebook Token Exchange Endpoint
// Route: POST /api/integrations/facebook/exchange-token
// Exchanges a short-lived user token for a 60-day long-lived token, and fetches
// permanent (never-expiring) Page Access Tokens for all managed pages.
// ==============================================================================

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const {
    userToken,
    appId = process.env.FB_APP_ID || '',
    appSecret = process.env.FB_APP_SECRET || '',
    isDryRun = false
  } = req.body || {};

  const effectiveToken = userToken || process.env.FB_PAGE_ACCESS_TOKEN || '';

  if (!effectiveToken && !isDryRun) {
    return res.status(400).json({ error: 'userToken is required for token exchange.' });
  }

  const isSimulated = Boolean(
    isDryRun || 
    !effectiveToken || 
    effectiveToken.startsWith('mock_') || 
    !appId || 
    !appSecret
  );

  // 1. Simulation / Dev Fallback Mode
  if (isSimulated) {
    const simulatedLongLivedToken = `EAA${Math.random().toString(36).substring(2, 10)}LONG_LIVED_60_DAYS`;
    const simulatedPageToken = `EAABwz${Math.random().toString(36).substring(2, 12)}PERMANENT_PAGE_TOKEN_NEVER_EXPIRES`;

    return res.status(200).json({
      success: true,
      isDryRun: true,
      message: 'Token exchanged successfully (Simulation mode: Permanent Page Token generated).',
      tokenType: 'Never-Expiring Page Access Token',
      expiresIn: 'Never (Permanent Page Token)',
      longLivedUserToken: simulatedLongLivedToken,
      pages: [
        {
          id: '109847291834910',
          name: 'Trollogiya Official Facebook Page',
          category: 'Entertainment & Satire Media',
          accessToken: simulatedPageToken,
          tasks: ['MANAGE', 'CREATE_CONTENT', 'MODERATE', 'ANALYZE']
        },
        {
          id: '208394819284711',
          name: 'Zuu Agent Tech Labs',
          category: 'Software & Technology',
          accessToken: simulatedPageToken,
          tasks: ['MANAGE', 'CREATE_CONTENT']
        }
      ]
    });
  }

  // 2. Live Meta Graph API Token Exchange
  try {
    // Step A: Exchange short-lived token for 60-day long-lived token
    const exchangeUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${effectiveToken}`;
    const exchangeRes = await fetch(exchangeUrl);
    const exchangeData = await exchangeRes.json();

    if (!exchangeRes.ok || !exchangeData.access_token) {
      throw new Error(exchangeData?.error?.message || 'Failed to exchange for long-lived user token.');
    }

    const longLivedUserToken = exchangeData.access_token;

    // Step B: Fetch permanent page access tokens using the long-lived token
    const accountsUrl = `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,category,access_token&access_token=${longLivedUserToken}`;
    const accountsRes = await fetch(accountsUrl);
    const accountsData = await accountsRes.json();

    if (!accountsRes.ok) {
      throw new Error(accountsData?.error?.message || 'Failed to retrieve managed Page tokens.');
    }

    const pages = (accountsData.data || []).map((page: any) => ({
      id: page.id,
      name: page.name,
      category: page.category,
      accessToken: page.access_token,
      tasks: page.tasks || []
    }));

    return res.status(200).json({
      success: true,
      isDryRun: false,
      message: `Successfully obtained permanent access tokens for ${pages.length} managed Facebook Page(s).`,
      tokenType: 'Never-Expiring Page Access Token',
      expiresIn: 'Never',
      longLivedUserToken,
      pages
    });
  } catch (err: any) {
    return res.status(502).json({
      success: false,
      error: err.message || 'Meta OAuth token exchange failed',
      setupGuidance: 'Verify that App ID, App Secret, and User Access Token are valid business credentials.'
    });
  }
}
