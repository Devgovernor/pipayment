import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SettlementScheduleService } from '../../settlements/services/settlement-schedule.service';
import { MonitoringService } from '../../monitoring/monitoring.service';

@Injectable()
export class SettlementTask {
  private readonly logger = new Logger(SettlementTask.name);

  constructor(
    private readonly settlementScheduleService: SettlementScheduleService,
    private readonly monitoringService: MonitoringService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processSettlements() {
    try {
      this.logger.debug('Starting daily settlement processing');
      const startTime = Date.now();

      await this.settlementScheduleService.processScheduledSettlements();

      this.monitoringService.recordMetric('settlement.daily_process', 1, {
        duration: Date.now() - startTime,
      });
    } catch (error) {
      this.logger.error(`Daily settlement processing failed: ${error.message}`, error.stack);
      this.monitoringService.recordMetric('settlement.daily_process_error', 1, {
        error: error.message,
      });
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async checkPendingSettlements() {
    try {
      await this.settlementScheduleService.checkSettlementSchedule();
    } catch (error) {
      this.logger.error(`Settlement schedule check failed: ${error.message}`, error.stack);
      this.monitoringService.recordMetric('settlement.schedule_check_error', 1, {
        error: error.message,
      });
    }
  }
}