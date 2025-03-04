import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ApiKeysService } from '../../api-keys/api-keys.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyRotationMiddleware implements NestMiddleware {
  constructor(
    private readonly apiKeysService: ApiKeysService,
    private readonly configService: ConfigService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const apiKey = req.headers.authorization?.replace('Bearer ', '');
    if (!apiKey) {
      return next();
    }

    const key = await this.apiKeysService.findByKey(apiKey);
    if (!key) {
      return next();
    }

    // Check if key needs rotation (older than 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (key.createdAt < thirtyDaysAgo) {
      // Generate new key
      const newKey = await this.apiKeysService.rotateKey(key.id);
      
      // Add warning header about key rotation
      res.setHeader('X-Api-Key-Rotation', 'Your API key will expire soon. Please start using the new key.');
      res.setHeader('X-New-Api-Key', newKey.key);
    }

    next();
  }
}