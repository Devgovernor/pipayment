import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Settlement } from '../entities/settlement.entity';
import { Payment } from '../../database/entities/payment.entity';
import { PaymentStatus } from '../../payments/enums/payment-status.enum';
import { MonitoringService } from '../../monitoring/monitoring.service';

@Injectable()
export class SettlementReportService {
  private readonly logger = new Logger(SettlementReportService.name);

  constructor(
    @InjectRepository(Settlement)
    private readonly settlementRepository: Repository<Settlement>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly monitoringService: MonitoringService,
  ) {}

  async generateSettlementReport(
    merchantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    settlements: any[];
    summary: any;
  }> {
    try {
      // Get settlements in date range
      const settlements = await this.settlementRepository.find({
        where: {
          merchant: { id: merchantId },
          createdAt: Between(startDate, endDate),
        },
        order: { createdAt: 'DESC' },
      });

      // Get payments in date range
      const payments = await this.paymentRepository.find({
        where: {
          merchant: { id: merchantId },
          createdAt: Between(startDate, endDate),
        },
      });

      // Calculate summary statistics
      const summary = this.calculateSummary(settlements, payments);

      // Format settlements for report
      const formattedSettlements = settlements.map(settlement => ({
        id: settlement.id,
        amount: settlement.amount,
        currency: settlement.currency,
        status: settlement.status,
        createdAt: settlement.createdAt,
        metadata: settlement.metadata,
      }));

      // Record metric
      this.monitoringService.recordMetric('settlement.report_generated', 1, {
        merchantId,
        settlementCount: settlements.length,
        totalAmount: summary.totalAmount,
      });

      return {
        settlements: formattedSettlements,
        summary,
      };
    } catch (error) {
      this.logger.error(`Failed to generate settlement report: ${error.message}`, error.stack);
      this.monitoringService.recordMetric('settlement.report_error', 1, {
        merchantId,
        error: error.message,
      });
      throw error;
    }
  }

  private calculateSummary(settlements: Settlement[], payments: Payment[]) {
    const summary = {
      totalAmount: 0,
      totalFees: 0,
      netAmount: 0,
      settlementCount: settlements.length,
      completedSettlements: 0,
      pendingSettlements: 0,
      failedSettlements: 0,
      totalTransactions: payments.length,
      completedTransactions: 0,
      refundedTransactions: 0,
      averageSettlementTime: 0,
    };

    // Calculate settlement statistics
    for (const settlement of settlements) {
      summary.totalAmount += settlement.amount;
      summary.totalFees += (settlement.metadata as any)?.totalFees || 0;
      summary.netAmount += settlement.amount;

      switch (settlement.status) {
        case 'completed':
          summary.completedSettlements++;
          break;
        case 'pending':
          summary.pendingSettlements++;
          break;
        case 'failed':
          summary.failedSettlements++;
          break;
      }
    }

    // Calculate payment statistics
    for (const payment of payments) {
      if (payment.status === PaymentStatus.COMPLETED) {
        summary.completedTransactions++;
      } else if (payment.status === PaymentStatus.REFUNDED) {
        summary.refundedTransactions++;
      }
    }

    // Calculate average settlement time
    if (settlements.length > 0) {
      const totalTime = settlements.reduce((sum, settlement) => {
        const createdAt = new Date(settlement.createdAt).getTime();
        const completedAt = new Date((settlement.metadata as any)?.completedAt || settlement.createdAt).getTime();
        return sum + (completedAt - createdAt);
      }, 0);
      summary.averageSettlementTime = totalTime / settlements.length;
    }

    return summary;
  }
}