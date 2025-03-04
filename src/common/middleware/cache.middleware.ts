import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CacheService } from '../../cache/cache.service';

@Injectable()
export class CacheMiddleware implements NestMiddleware {
  constructor(private readonly cacheService: CacheService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const key = `cache:${req.method}:${req.url}`;
    
    // Try to get from cache
    const cachedData = await this.cacheService.get(key);
    if (cachedData) {
      return res.json(cachedData);
    }

    // Store original send method
    const originalSend = res.json;
    const cacheService = this.cacheService;

    // Override send method to cache response
    res.json = function(body: any): Response {
      if (res.statusCode === 200) {
        cacheService.set(key, body, 300); // Cache for 5 minutes
      }
      return originalSend.call(this, body);
    };

    next();
  }
}