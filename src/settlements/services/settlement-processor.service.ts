import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { Settlement } from '../entities/settlement.entity';
import { Payment } from '../../database/entities/payment.entity';
import { PaymentStatus } from '../../payments/enums/payment-status.enum';
import { SettlementStatus } from '../enums/settlement-status.enum';
import { EmailService } from '../../notifications/services/email.service';
import { MonitoringService } from '../../monitoring/monitoring.service';
import { DateUtils } from '../../common/utils/date.utils';

@Injectable()
export class SettlementProcessorService {
  private readonly logger = new Logger(SettlementProcessorService.name);

  constructor(
    @InjectRepository(Settlement)
    private readonly settlementRepository: Repository<Settlement>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly emailService: EmailService,
    private readonly monitoringService: MonitoringService,
  ) {}

  async processSettlements(merchantId: string, startDate: Date, endDate: Date): Promise<Settlement | undefined> {
    try {
      const startTime = Date.now();
      this.logger.debug(`Processing settlements for merchant ${merchantId}`);

      // Get all completed payments for the merchant in the date range
      const payments = await this.paymentRepository.find({
        where: {
          merchant: { id: merchantId },
          status: PaymentStatus.COMPLETED,
          createdAt: Between(startDate, endDate),
        },
        relations: ['merchant'],
      });

      if (payments.length === 0) {
        this.logger.debug('No payments found for settlement');
        return undefined;
      }

      // Calculate settlement amounts
      const {
        totalAmount,
        totalFees,
        netAmount,
        refundAmount,
        transactionCount,
      } = this.calculateSettlementAmounts(payments);

      // Create settlement record
      const settlement = this.settlementRepository.create({
        merchant: { id: merchantId },
        amount: netAmount,
        currency: 'PI', // Assuming PI is the currency
        status: SettlementStatus.PROCESSING,
        metadata: {
          periodStart: startDate.toISOString(),
          periodEnd: endDate.toISOString(),
          totalAmount,
          totalFees,
          refundAmount,
          transactionCount,
          paymentIds: payments.map(p => p.id),
        },
      });

      const savedSettlement = await this.settlementRepository.save(settlement);

      // Send notification
      await this.emailService.sendTemplatedEmail(
        payments[0].merchant.email,
        'settlement-processed',
        {
          settlementId: savedSettlement.id,
          amount: netAmount,
          currency: 'PI',
          periodStart: startDate.toISOString(),
          periodEnd: endDate.toISOString(),
          totalPayments: transactionCount,
          totalRefunds: refundAmount,
          fees: totalFees,
          netAmount,
        },
      );

      // Record metrics
      this.monitoringService.recordMetric('settlement.processed', 1, {
        merchantId,
        amount: netAmount,
        duration: Date.now() - startTime,
      });

      return savedSettlement;
    } catch (error) {
      this.logger.error(`Settlement processing failed: ${error.message}`, error.stack);
      this.monitoringService.recordMetric('settlement.error', 1, {
        merchantId,
        error: error.message,
      });
      throw error;
    }
  }

  private calculateSettlementAmounts(payments: Payment[]): {
    totalAmount: number;
    totalFees: number;
    netAmount: number;
    refundAmount: number;
    transactionCount: number;
  } {
    let totalAmount = 0;
    let refundAmount = 0;
    let transactionCount = 0;

    for (const payment of payments) {
      if (payment.status === PaymentStatus.REFUNDED) {
        refundAmount += payment.amount;
      } else {
        totalAmount += payment.amount;
        transactionCount++;
      }
    }

    // Calculate fees (example: 2.5% + 0.30 PI per transaction)
    const feePercentage = 0.025;
    const fixedFee = 0.30;
    const totalFees = (totalAmount * feePercentage) + (transactionCount * fixedFee);

    const netAmount = totalAmount - totalFees - refundAmount;

    return {
      totalAmount,
      totalFees,
      netAmount,
      refundAmount,
      transactionCount,
    };
  }

  async getNextSettlementDate(merchantId: string): Promise<Date> {
    // Get last settlement
    const lastSettlement = await this.settlementRepository.findOne({
      where: { merchant: { id: merchantId } },
      order: { createdAt: 'DESC' },
    });

    if (!lastSettlement) {
      // If no previous settlement, start from the beginning of the current period
      return DateUtils.getStartOfDay(new Date());
    }

    // Next settlement starts after the last settlement's end date
    const metadata = lastSettlement.metadata as any;
    return new Date(metadata.periodEnd);
  }

  async checkPendingSettlements(): Promise<void> {
    const pendingSettlements = await this.settlementRepository.find({
      where: {
        status: SettlementStatus.PENDING,
        createdAt: MoreThanOrEqual(DateUtils.addDays(new Date(), -7)), // Only check recent settlements
      },
      relations: ['merchant'],
    });

    for (const settlement of pendingSettlements) {
      try {
        // TODO: Integrate with actual payout system
        // For now, just mark as completed
        settlement.status = SettlementStatus.COMPLETED;
        await this.settlementRepository.save(settlement);

        this.monitoringService.recordMetric('settlement.completed', 1, {
          merchantId: settlement.merchant.id,
          amount: settlement.amount,
        });
      } catch (error) {
        this.logger.error(
          `Failed to process pending settlement ${settlement.id}: ${error.message}`,
          error.stack,
        );
        
        settlement.status = SettlementStatus.FAILED;
        settlement.metadata = {
          ...settlement.metadata,
          error: error.message,
          failedAt: new Date().toISOString(),
        };
        await this.settlementRepository.save(settlement);

        this.monitoringService.recordMetric('settlement.failed', 1, {
          merchantId: settlement.merchant.id,
          error: error.message,
        });
      }
    }
  }
}