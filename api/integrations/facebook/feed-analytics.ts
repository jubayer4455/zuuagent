// ==============================================================================
// Zuu Agent — Facebook Feed & Engagement Analytics Reader Endpoint
// Route: GET or POST /api/integrations/facebook/feed-analytics
// Inspects recent post reactions, shares, and comments from Meta Graph API
// to provide actionable feedback metrics for AI prompt self-optimization.
// ==============================================================================

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use GET or POST.' });
  }

  const {
    pageId = process.env.FB_PAGE_ID || '109847291834910',
    limit = 5
  } = (req.method === 'POST' ? req.body : req.query) || {};

  const token = process.env.FB_PAGE_ACCESS_TOKEN || '';
  const isSimulated = Boolean(!token || token.startsWith('mock_') || token.length < 20);

  // 1. Simulation / Fallback Feed Analytics
  if (isSimulated) {
    return res.status(200).json({
      success: true,
      isSimulated: true,
      pageId,
      totalAnalyzed: 3,
      overallEngagementScore: 94.2,
      insights: {
        topFormat: 'Bengali Satire & Humor with Emojis',
        peakEngagementTime: '2:00 PM (14:00 Dhaka Time)',
        averageReactions: 412,
        averageComments: 89,
        viralityFactor: 'High (3.2x benchmark)'
      },
      recentPosts: [
        {
          id: `${pageId}_101`,
          message: 'বৃষ্টির দিনে বাঙালি জাতির ৩টি সার্বজনীন ইচ্ছা: গরম খিচুড়ি আর বেগুন ভাজা! 😂🍛',
          createdTime: new Date(Date.now() - 3600000 * 24).toISOString(),
          reactionsCount: 524,
          commentsCount: 112,
          sharesCount: 48,
          sentiment: 'Positive (96%)'
        },
        {
          id: `${pageId}_102`,
          message: 'অফিসে যখন বস বলে— "কাজটা আর্জেন্ট না, তবে এখনই চাই!" 🙃',
          createdTime: new Date(Date.now() - 3600000 * 48).toISOString(),
          reactionsCount: 388,
          commentsCount: 94,
          sharesCount: 31,
          sentiment: 'Humorous (98%)'
        }
      ]
    });
  }

  // 2. Live Meta Graph API Probe
  try {
    const endpoint = `https://graph.facebook.com/v21.0/${pageId}/feed?fields=id,message,created_time,shares,reactions.summary(total_count),comments.summary(total_count)&limit=${limit}&access_token=${token}`;
    const response = await fetch(endpoint);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error?.message || 'Failed to fetch feed metrics from Meta Graph API.');
    }

    const posts = (data.data || []).map((p: any) => ({
      id: p.id,
      message: p.message || '[Media/Photo]',
      createdTime: p.created_time,
      reactionsCount: p.reactions?.summary?.total_count || 0,
      commentsCount: p.comments?.summary?.total_count || 0,
      sharesCount: p.shares?.count || 0
    }));

    const totalReactions = posts.reduce((sum: number, p: any) => sum + p.reactionsCount, 0);
    const avgReactions = posts.length > 0 ? Math.round(totalReactions / posts.length) : 0;

    return res.status(200).json({
      success: true,
      isSimulated: false,
      pageId,
      totalAnalyzed: posts.length,
      insights: {
        averageReactions: avgReactions,
        topFormat: 'Identified from live page feed'
      },
      recentPosts: posts
    });
  } catch (err: any) {
    return res.status(502).json({
      success: false,
      error: err.message || 'Meta Graph API feed analytics failed'
    });
  }
}
