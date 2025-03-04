import { Module } from '@nestjs/common';
import { BackupService } from './backup.service';
import { MonitoringModule } from '../monitoring/monitoring.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MonitoringModule,
    NotificationsModule,
  ],
  providers: [BackupService],
  exports: [BackupService],
})
export class BackupModule {}