import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private rateLimiter: RateLimiterRedis;

  constructor(private readonly configService: ConfigService) {
    const redisClient = new Redis({
      host: this.configService.get('app.redis.host'),
      port: this.configService.get('app.redis.port'),
      enableOfflineQueue: false,
    });

    this.rateLimiter = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'ratelimit',
      points: 100, // Number of points
      duration: 60, // Per 60 seconds
    });
  }

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const key = req.ip || req.socket.remoteAddress || '0.0.0.0';
      await this.rateLimiter.consume(key);
      next();
    } catch (error) {
      res.status(429).json({
        statusCode: 429,
        message: 'Too Many Requests',
        error: 'Rate limit exceeded',
      });
    }
  }
}