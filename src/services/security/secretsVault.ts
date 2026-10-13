// ==============================================================================
// Zuu Agent — AES-256-GCM Encrypted Secrets Vault
// Implements military-grade authenticated encryption for sensitive credentials
// (Facebook Page Access Tokens, Gemini / OpenAI API Keys).
// ==============================================================================

import crypto from 'crypto';

const MASTER_ENCRYPTION_KEY = process.env.ENCRYPTION_MASTER_KEY || 'zuu_agent_enterprise_master_key_32bytes!!';

export class SecretsVaultService {
  private static ALGORITHM = 'aes-256-gcm';
  private static IV_LENGTH = 16;
  private static TAG_LENGTH = 16;

  /**
   * Encrypts plaintext secret using AES-256-GCM
   */
  static encrypt(plaintext: string): { encryptedPayload: string; fingerprint: string } {
    // Derive 32-byte key
    const key = crypto.createHash('sha256').update(MASTER_ENCRYPTION_KEY).digest();
    const iv = crypto.randomBytes(this.IV_LENGTH);

    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = (cipher as any).getAuthTag();

    // Format: iv:authTag:encrypted
    const payload = `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    const fingerprint = this.computeFingerprint(plaintext);

    return {
      encryptedPayload: payload,
      fingerprint
    };
  }

  /**
   * Decrypts an encrypted payload using AES-256-GCM
   */
  static decrypt(payload: string): string {
    try {
      const parts = payload.split(':');
      if (parts.length !== 3) {
        throw new Error('Malformed encrypted payload format.');
      }

      const [ivHex, tagHex, encryptedHex] = parts;
      const key = crypto.createHash('sha256').update(MASTER_ENCRYPTION_KEY).digest();
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(tagHex, 'hex');

      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
      (decipher as any).setAuthTag(authTag);

      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (err: any) {
      throw new Error(`Decryption failed: ${err.message}`);
    }
  }

  /**
   * Computes safe public fingerprint for UI display
   */
  static computeFingerprint(secret: string): string {
    if (!secret || secret.length < 8) return '****';
    const prefix = secret.substring(0, 6);
    const suffix = secret.slice(-4);
    const hash = crypto.createHash('sha256').update(secret).digest('hex').substring(0, 8);
    return `${prefix}...${suffix} (hash:${hash})`;
  }
}
