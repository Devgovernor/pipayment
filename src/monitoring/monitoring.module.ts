import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonitoringService } from './monitoring.service';
import { MonitoringController } from './monitoring.controller';
import { SystemMetric } from './entities/system-metric.entity';
import { ErrorLog } from './entities/error-log.entity';
import { AuditLog } from './entities/audit-log.entity';
import { ErrorTrackingService } from './services/error-tracking.service';
import { PerformanceService } from './services/performance.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([SystemMetric, ErrorLog, AuditLog]),
  ],
  providers: [
    MonitoringService,
    ErrorTrackingService,
    PerformanceService,
  ],
  controllers: [MonitoringController],
  exports: [
    MonitoringService,
    ErrorTrackingService,
    PerformanceService,
  ],
})
export class MonitoringModule {}