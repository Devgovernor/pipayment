import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Payment } from '../../database/entities/payment.entity';
import { FraudAlert, FraudAlertType } from '../entities/fraud-alert.entity';
import { RiskScore } from '../entities/risk-score.entity';
import { MonitoringService } from '../../monitoring/monitoring.service';

@Injectable()
export class FraudRulesService {
  private readonly logger = new Logger(FraudRulesService.name);

  constructor(
    @InjectRepository(FraudAlert)
    private readonly fraudAlertRepository: Repository<FraudAlert>,
    @InjectRepository(RiskScore)
    private readonly riskScoreRepository: Repository<RiskScore>,
    private readonly monitoringService: MonitoringService,
  ) {}

  async evaluatePayment(payment: Payment): Promise<RiskScore> {
    const riskFactors: Record<string, number> = {};
    let totalScore = 0;

    // Check amount threshold
    const amountScore = this.evaluateAmount(payment.amount);
    if (amountScore > 0) {
      riskFactors.amount = amountScore;
      totalScore += amountScore;
    }

    // Check velocity
    const velocityScore = await this.evaluateVelocity(payment);
    if (velocityScore > 0) {
      riskFactors.velocity = velocityScore;
      totalScore += velocityScore;
    }

    // Check merchant history
    const merchantScore = await this.evaluateMerchantHistory(payment);
    if (merchantScore > 0) {
      riskFactors.merchant = merchantScore;
      totalScore += merchantScore;
    }

    // Create risk score record
    const riskScore = this.riskScoreRepository.create({
      payment,
      score: totalScore,
      factors: riskFactors,
      metadata: {
        evaluatedAt: new Date().toISOString(),
      },
    });

    await this.riskScoreRepository.save(riskScore);

    // Create alerts if needed
    await this.createAlertsFromScore(payment, riskScore);

    // Record metrics
    this.monitoringService.recordMetric('fraud.risk_score', totalScore, {
      merchantId: payment.merchant.id,
      factors: Object.keys(riskFactors).join(','),
    });

    return riskScore;
  }

  private evaluateAmount(amount: number): number {
    if (amount >= 10000) return 0.8; // Very high amount
    if (amount >= 5000) return 0.5; // High amount
    if (amount >= 1000) return 0.3; // Moderate amount
    return 0;
  }

  private async evaluateVelocity(payment: Payment): Promise<number> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const recentPayments = await this.riskScoreRepository.count({
      where: {
        payment: {
          merchant: { id: payment.merchant.id },
          createdAt: MoreThan(fiveMinutesAgo),
        },
      },
    });

    if (recentPayments >= 50) return 0.9; // Very high velocity
    if (recentPayments >= 20) return 0.6; // High velocity
    if (recentPayments >= 10) return 0.3; // Moderate velocity
    return 0;
  }

  private async evaluateMerchantHistory(payment: Payment): Promise<number> {
    const recentAlerts = await this.fraudAlertRepository.count({
      where: {
        payment: { merchant: { id: payment.merchant.id } },
        createdAt: MoreThan(new Date(Date.now() - 24 * 60 * 60 * 1000)),
      },
    });

    if (recentAlerts >= 5) return 0.8; // High risk merchant
    if (recentAlerts >= 2) return 0.4; // Moderate risk merchant
    return 0;
  }

  private async createAlertsFromScore(payment: Payment, riskScore: RiskScore): Promise<void> {
    if (riskScore.factors.amount >= 0.8) {
      await this.createFraudAlert(
        payment,
        FraudAlertType.SUSPICIOUS_AMOUNT,
        'Unusually high transaction amount detected',
      );
    }

    if (riskScore.factors.velocity >= 0.6) {
      await this.createFraudAlert(
        payment,
        FraudAlertType.VELOCITY_CHECK,
        'High transaction velocity detected',
      );
    }

    if (riskScore.score >= 0.7) {
      this.monitoringService.recordMetric('fraud.high_risk_payment', 1, {
        merchantId: payment.merchant.id,
        score: riskScore.score,
      });
    }
  }

  private async createFraudAlert(
    payment: Payment,
    type: FraudAlertType,
    description: string,
  ): Promise<void> {
    const alert = this.fraudAlertRepository.create({
      payment,
      type,
      description,
      metadata: {
        createdAt: new Date().toISOString(),
      },
    });

    await this.fraudAlertRepository.save(alert);

    this.monitoringService.recordMetric('fraud.alert_created', 1, {
      type,
      merchantId: payment.merchant.id,
    });
  }
}