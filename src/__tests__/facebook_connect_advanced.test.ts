import { describe, it, expect } from 'vitest';
import handleFacebookExchangeToken from '../../api/integrations/facebook/exchange-token';
import handleFacebookPages from '../../api/integrations/facebook/pages';
import handleFacebookReplyComment from '../../api/integrations/facebook/reply-comment';
import handleFacebookFeedAnalytics from '../../api/integrations/facebook/feed-analytics';

function createMockRes() {
  let statusCode = 200;
  let responseData: any = null;
  return {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(data: any) {
      responseData = data;
      return this;
    },
    getStatusCode: () => statusCode,
    getData: () => responseData
  };
}

describe('Meta Facebook Advanced Connect Suite', () => {
  it('discovers managed Facebook Pages in simulation/fallback mode', async () => {
    const req = { method: 'POST', body: { tokenOverride: 'mock_token' }, headers: {}, query: {} };
    const res = createMockRes();

    await handleFacebookPages(req, res);
    expect(res.getStatusCode()).toBe(200);
    const data = res.getData();
    expect(data.success).toBe(true);
    expect(data.pages.length).toBeGreaterThan(0);
    expect(data.pages[0].id).toBe('109847291834910');
  });

  it('exchanges short-lived token for permanent never-expiring page token', async () => {
    const req = { method: 'POST', body: { isDryRun: true }, headers: {}, query: {} };
    const res = createMockRes();

    await handleFacebookExchangeToken(req, res);
    expect(res.getStatusCode()).toBe(200);
    const data = res.getData();
    expect(data.success).toBe(true);
    expect(data.tokenType).toContain('Page Access Token');
    expect(data.expiresIn).toContain('Never');
    expect(data.pages.length).toBeGreaterThan(0);
  });

  it('generates contextual AI reply to incoming Facebook comment', async () => {
    const req = {
      method: 'POST',
      body: {
        commentId: 'cmt_test_1001',
        commentMessage: 'পোস্টটি খুবই দারুণ হয়েছে!',
        isDryRun: true
      },
      headers: {},
      query: {}
    };
    const res = createMockRes();

    await handleFacebookReplyComment(req, res);
    expect(res.getStatusCode()).toBe(200);
    const data = res.getData();
    expect(data.success).toBe(true);
    expect(data.generatedReply).toBeDefined();
    expect(data.replyCommentId).toBeDefined();
  });

  it('calculates feed analytics and virality scores from page data', async () => {
    const req = { method: 'GET', query: { pageId: '109847291834910' }, headers: {}, body: {} };
    const res = createMockRes();

    await handleFacebookFeedAnalytics(req, res);
    expect(res.getStatusCode()).toBe(200);
    const data = res.getData();
    expect(data.success).toBe(true);
    expect(data.overallEngagementScore).toBeGreaterThan(80);
    expect(data.recentPosts.length).toBeGreaterThan(0);
  });
});
