import { Injectable, Logger } from '@nestjs/common';
import { Payment } from '../database/entities/payment.entity';
import { FraudRulesService } from './services/fraud-rules.service';
import { DeviceFingerprintService } from './services/device-fingerprint.service';
import { IpIntelligenceService } from './services/ip-intelligence.service';
import { MlFraudDetectionService } from './services/ml-fraud-detection.service';
import { MonitoringService } from '../monitoring/monitoring.service';

@Injectable()
export class FraudPreventionService {
  private readonly logger = new Logger(FraudPreventionService.name);

  constructor(
    private readonly fraudRulesService: FraudRulesService,
    private readonly deviceFingerprintService: DeviceFingerprintService,
    private readonly ipIntelligenceService: IpIntelligenceService,
    private readonly mlFraudDetectionService: MlFraudDetectionService,
    private readonly monitoringService: MonitoringService,
  ) {}

  async evaluatePayment(
    payment: Payment,
    context: {
      userAgent: string;
      ip: string;
      headers: Record<string, string>;
    },
  ): Promise<{
    approved: boolean;
    score: number;
    reasons: string[];
  }> {
    try {
      const startTime = Date.now();
      const reasons: string[] = [];

      // Generate device fingerprint
      const fingerprint = this.deviceFingerprintService.generateFingerprint(context);
      const deviceTrustScore = await this.deviceFingerprintService.calculateDeviceTrustScore(fingerprint);

      // Analyze IP
      const ipAnalysis = await this.ipIntelligenceService.analyzeIp(context.ip);
      if (ipAnalysis.risk > 0.7) {
        reasons.push('High-risk IP address');
      }

      // Check for known bad IP
      if (await this.ipIntelligenceService.isKnownBadIp(context.ip)) {
        reasons.push('Known malicious IP address');
        return { approved: false, score: 1, reasons };
      }

      // Evaluate using rules engine
      const riskScore = await this.fraudRulesService.evaluatePayment(payment);
      if (riskScore.score > 0.7) {
        reasons.push('High risk score from rules engine');
      }

      // ML-based prediction
      const mlPrediction = await this.mlFraudDetectionService.predictFraud(payment);
      if (mlPrediction > 0.8) {
        reasons.push('High risk prediction from ML model');
      }

      // Calculate final risk score
      const finalScore = this.calculateFinalScore({
        ruleScore: riskScore.score,
        mlScore: mlPrediction,
        deviceTrustScore,
        ipRisk: ipAnalysis.risk,
      });

      // Record metrics
      await this.monitoringService.recordMetric('fraud.evaluation_time', Date.now() - startTime);
      await this.monitoringService.recordMetric('fraud.final_score', finalScore, {
        merchantId: payment.merchant.id,
        approved: finalScore < 0.7,
      });

      return {
        approved: finalScore < 0.7,
        score: finalScore,
        reasons,
      };
    } catch (error) {
      this.logger.error(`Fraud evaluation failed: ${error.message}`, error.stack);
      await this.monitoringService.recordMetric('fraud.evaluation_error', 1);
      
      // Fail closed - reject if we can't properly evaluate
      return {
        approved: false,
        score: 1,
        reasons: ['System error during fraud evaluation'],
      };
    }
  }

  private calculateFinalScore(scores: {
    ruleScore: number;
    mlScore: number;
    deviceTrustScore: number;
    ipRisk: number;
  }): number {
    // Weighted average of different scores
    const weights = {
      rules: 0.3,
      ml: 0.3,
      device: 0.2,
      ip: 0.2,
    };

    return (
      scores.ruleScore * weights.rules +
      scores.mlScore * weights.ml +
      (1 - scores.deviceTrustScore) * weights.device +
      scores.ipRisk * weights.ip
    );
  }
}