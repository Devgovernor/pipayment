import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';

@Injectable()
export class WebhookGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const signature = request.headers['x-webhook-signature'];
    const payload = JSON.stringify(request.body);

    if (!signature) {
      throw new UnauthorizedException('Missing webhook signature');
    }

    const secret = this.configService.get<string>('app.piNetwork.webhookSecret');
    
    if (!secret) {
      throw new UnauthorizedException('Webhook secret not configured');
    }

    const expectedSignature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    return true;
  }
}