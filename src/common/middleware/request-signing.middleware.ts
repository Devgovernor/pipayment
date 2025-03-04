import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createHmac, BinaryLike, KeyObject } from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RequestSigningMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const signature = req.headers['x-signature'];
    const timestamp = req.headers['x-timestamp'];

    if (!signature || !timestamp) {
      throw new UnauthorizedException('Missing signature headers');
    }

    // Verify timestamp is within 5 minutes
    const requestTime = new Date(timestamp.toString()).getTime();
    const currentTime = Date.now();
    if (Math.abs(currentTime - requestTime) > 5 * 60 * 1000) {
      throw new UnauthorizedException('Request timestamp expired');
    }

    // Recreate signature
    const payload = JSON.stringify({
      method: req.method,
      url: req.url,
      body: req.body,
      timestamp,
    });

    const secret = this.configService.get<string>('app.apiSigningSecret');
    if (!secret) {
      throw new UnauthorizedException('API signing secret not configured');
    }

    const expectedSignature = createHmac('sha256', secret as BinaryLike | KeyObject)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new UnauthorizedException('Invalid request signature');
    }

    next();
  }
}