import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';

@Injectable()
export class ErrorTrackingService implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const dsn = this.configService.get<string>('sentry.dsn');
    if (dsn) {
      Sentry.init({
        dsn,
        environment: this.configService.get<string>('app.environment'),
        tracesSampleRate: 1.0,
      });
    }
  }

  captureException(error: Error, context?: any): void {
    Sentry.withScope(scope => {
      if (context) {
        scope.setExtras(context);
      }
      Sentry.captureException(error);
    });
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    Sentry.captureMessage(message, level as any);
  }

  setUser(user: { id: string; email?: string }): void {
    Sentry.setUser(user);
  }
}