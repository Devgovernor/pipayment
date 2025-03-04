import { createHash, randomBytes, createHmac } from 'crypto';

export class SecurityUtils {
  static hashPassword(password: string, salt: string = randomBytes(16).toString('hex')): { hash: string; salt: string } {
    const hash = createHash('sha256')
      .update(salt + password)
      .digest('hex');
    return { hash, salt };
  }

  static verifyPassword(password: string, hash: string, salt: string): boolean {
    const inputHash = createHash('sha256')
      .update(salt + password)
      .digest('hex');
    return inputHash === hash;
  }

  static generateApiKey(): string {
    return randomBytes(32).toString('hex');
  }

  static generateSecureToken(length: number = 32): string {
    return randomBytes(length).toString('base64');
  }

  static generateHmac(data: string, secret: string): string {
    return createHmac('sha256', secret)
      .update(data)
      .digest('hex');
  }
}