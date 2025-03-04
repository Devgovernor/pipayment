import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class IpAllowlistMiddleware implements NestMiddleware {
  private allowedIps: string[];

  constructor(private readonly configService: ConfigService) {
    this.allowedIps = this.configService.get<string>('app.allowedIps', '').split(',');
  }

  use(req: Request, res: Response, next: NextFunction) {
    const clientIp = req.ip || '';

    if (!this.allowedIps.includes(clientIp)) {
      throw new ForbiddenException('IP address not allowed');
    }

    next();
  }
}