import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Merchant } from '../../database/entities/merchant.entity';
import { SettlementProcessorService } from './settlement-processor.service';
import { DateUtils } from '../../common/utils/date.utils';
import { MonitoringService } from '../../monitoring/monitoring.service';

@Injectable()
export class SettlementScheduleService {
  private readonly logger = new Logger(SettlementScheduleService.name);

  constructor(
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
    private readonly settlementProcessorService: SettlementProcessorService,
    private readonly monitoringService: MonitoringService,
  ) {}

  async processScheduledSettlements(): Promise<void> {
    try {
      const startTime = Date.now();
      this.logger.debug('Starting scheduled settlement processing');

      // Get all active merchants
      const merchants = await this.merchantRepository.find({
        where: { isActive: true },
      });

      let processedCount = 0;
      let errorCount = 0;

      for (const merchant of merchants) {
        try {
          // Get settlement period
          const startDate = await this.settlementProcessorService.getNextSettlementDate(merchant.id);
          const endDate = DateUtils.getEndOfDay(new Date());

          // Process settlement
          await this.settlementProcessorService.processSettlements(
            merchant.id,
            startDate,
            endDate,
          );

          processedCount++;
        } catch (error) {
          this.logger.error(
            `Failed to process settlement for merchant ${merchant.id}: ${error.message}`,
            error.stack,
          );
          errorCount++;
        }
      }

      // Record metrics
      this.monitoringService.recordMetric('settlement.batch_processed', 1, {
        merchantCount: merchants.length,
        successCount: processedCount,
        errorCount,
        duration: Date.now() - startTime,
      });

      this.logger.debug(
        `Completed settlement processing: ${processedCount} succeeded, ${errorCount} failed`,
      );
    } catch (error) {
      this.logger.error(`Settlement batch processing failed: ${error.message}`, error.stack);
      this.monitoringService.recordMetric('settlement.batch_error', 1, {
        error: error.message,
      });
    }
  }

  async checkSettlementSchedule(): Promise<void> {
    try {
      // Check for any pending settlements that need processing
      await this.settlementProcessorService.checkPendingSettlements();
    } catch (error) {
      this.logger.error(`Settlement schedule check failed: ${error.message}`, error.stack);
      this.monitoringService.recordMetric('settlement.schedule_error', 1, {
        error: error.message,
      });
    }
  }
}