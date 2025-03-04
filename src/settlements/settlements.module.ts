import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Settlement } from './entities/settlement.entity';
import { Payment } from '../database/entities/payment.entity';
import { Merchant } from '../database/entities/merchant.entity';
import { SettlementsService } from './settlements.service';
import { SettlementProcessorService } from './services/settlement-processor.service';
import { SettlementScheduleService } from './services/settlement-schedule.service';
import { SettlementReportService } from './services/settlement-report.service';
import { SettlementsController } from './settlements.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { MonitoringModule } from '../monitoring/monitoring.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Settlement, Payment, Merchant]),
    NotificationsModule,
    MonitoringModule,
  ],
  controllers: [SettlementsController],
  providers: [
    SettlementsService,
    SettlementProcessorService,
    SettlementScheduleService,
    SettlementReportService,
  ],
  exports: [
    SettlementsService,
    SettlementProcessorService,
    SettlementScheduleService,
    SettlementReportService,
  ],
})
export class SettlementsModule {}