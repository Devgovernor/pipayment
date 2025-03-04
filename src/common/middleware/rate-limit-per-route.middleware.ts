import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RateLimitPerRouteMiddleware implements NestMiddleware {
  private rateLimiters: Map<string, RateLimiterRedis> = new Map();

  constructor(private readonly configService: ConfigService) {
    const redisClient = new Redis({
      host: this.configService.get('app.redis.host'),
      port: this.configService.get('app.redis.port'),
      enableOfflineQueue: false,
    });

    // Define rate limits per route
    const rateLimits = {
      '/api/merchant/v1/payments': { points: 100, duration: 60 }, // 100 requests per minute
      '/api/merchant/v1/customers': { points: 50, duration: 60 }, // 50 requests per minute
      '/api/merchant/v1/invoices': { points: 30, duration: 60 }, // 30 requests per minute
    };

    // Create rate limiters
    for (const [route, limits] of Object.entries(rateLimits)) {
      this.rateLimiters.set(route, new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: `ratelimit:${route}`,
        points: limits.points,
        duration: limits.duration,
      }));
    }
  }

  async use(req: Request, res: Response, next: NextFunction) {
    const rateLimiter = this.rateLimiters.get(req.path);
    if (!rateLimiter) {
      return next();
    }

    try {
      const key = req.ip || req.socket.remoteAddress || '0.0.0.0';
      const rateLimiterRes = await rateLimiter.consume(key);
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', rateLimiter.points);
      res.setHeader('X-RateLimit-Remaining', rateLimiterRes.remainingPoints);
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString());
      
      next();
    } catch (error) {
      res.status(429).json({
        statusCode: 429,
        message: 'Too Many Requests',
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil(error.msBeforeNext / 1000),
      });
    }
  }
}