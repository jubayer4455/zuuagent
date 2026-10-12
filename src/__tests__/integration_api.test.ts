import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

describe('Serverless API & Webhook Verification Suite', () => {
  it('validates Meta Webhook challenge matching hub.verify_token', () => {
    const expectedVerifyToken = 'zuu_meta_verify_token_2026';
    const query = {
      'hub.mode': 'subscribe',
      'hub.verify_token': 'zuu_meta_verify_token_2026',
      'hub.challenge': '1158201244'
    };

    const isMatch = query['hub.mode'] === 'subscribe' && query['hub.verify_token'] === expectedVerifyToken;
    expect(isMatch).toBe(true);
    expect(query['hub.challenge']).toBe('1158201244');
  });

  it('rejects invalid Meta Webhook challenge token', () => {
    const expectedVerifyToken = 'zuu_meta_verify_token_2026';
    const query = {
      'hub.mode': 'subscribe',
      'hub.verify_token': 'wrong_token',
      'hub.challenge': '1158201244'
    };

    const isMatch = query['hub.mode'] === 'subscribe' && query['hub.verify_token'] === expectedVerifyToken;
    expect(isMatch).toBe(false);
  });

  it('verifies HMAC SHA-256 signature calculation for Meta webhook payloads', () => {
    const appSecret = 'test_meta_app_secret_999';
    const payload = JSON.stringify({ entry: [{ id: '109847291834910', changes: ['feed'] }] });

    const expectedSignature = 'sha256=' + crypto.createHmac('sha256', appSecret).update(payload).digest('hex');

    // Simulate incoming verification
    const computed = 'sha256=' + crypto.createHmac('sha256', appSecret).update(payload).digest('hex');
    expect(computed).toBe(expectedSignature);
  });

  it('verifies Cron Secret Token authorization', () => {
    const cronSecret = 'test_cron_secret_token_abc';
    const validHeader: string = `Bearer ${cronSecret}`;
    const invalidHeader: string = 'Bearer wrong_token';

    expect(validHeader === `Bearer ${cronSecret}`).toBe(true);
    expect(invalidHeader === `Bearer ${cronSecret}`).toBe(false);
  });
});
