import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import DeviceDetector from 'device-detector-js';
import { MonitoringService } from '../../monitoring/monitoring.service';

@Injectable()
export class DeviceTrackingInterceptor implements NestInterceptor {
  private deviceDetector = new DeviceDetector();

  constructor(private readonly monitoringService: MonitoringService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const userAgent = request.headers['user-agent'] || '';
    const device = this.deviceDetector.parse(userAgent);

    return next.handle().pipe(
      tap(() => {
        if (request.user) {
          this.monitoringService.logAudit(
            'login',
            request.user.id,
            request.user.id,
            { device },
            request.ip,
            userAgent,
          );
        }
      }),
    );
  }
}