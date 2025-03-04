import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RandomForestClassifier as RF } from 'ml-random-forest';
import { Payment } from '../../database/entities/payment.entity';
import { FraudAlert } from '../entities/fraud-alert.entity';
import { RiskScore } from '../entities/risk-score.entity';

@Injectable()
export class MlFraudDetectionService {
  private readonly logger = new Logger(MlFraudDetectionService.name);
  private model: RF;

  constructor(
    @InjectRepository(FraudAlert)
    private readonly fraudAlertRepository: Repository<FraudAlert>,
    @InjectRepository(RiskScore)
    private readonly riskScoreRepository: Repository<RiskScore>,
  ) {
    this.initializeModel();
  }

  private async initializeModel() {
    // Initialize and train the model with historical data
    const trainingData = await this.getTrainingData();
    this.model = new RF({
      seed: 42,
      maxFeatures: 0.8,
      replacement: true,
      nEstimators: 100,
    });

    if (trainingData.features.length > 0) {
      this.model.train(trainingData.features, trainingData.labels);
    }
  }

  private async getTrainingData() {
    // Get historical fraud alerts and payments
    const alerts = await this.fraudAlertRepository.find({
      relations: ['payment'],
    });

    const features = [];
    const labels = [];

    for (const alert of alerts) {
      if (alert.payment) {
        features.push(this.extractFeatures(alert.payment));
        labels.push(alert.resolved ? 0 : 1); // 0 for false positive, 1 for actual fraud
      }
    }

    return { features, labels };
  }

  private extractFeatures(payment: Payment): number[] {
    return [
      payment.amount,
      new Date(payment.createdAt).getHours(),
      payment.metadata?.attemptCount || 0,
      payment.metadata?.ipReputation || 0,
      payment.metadata?.deviceTrustScore || 0,
    ];
  }

  async predictFraud(payment: Payment): Promise<number> {
    try {
      const features = this.extractFeatures(payment);
      const prediction = this.model.predict([features]);
      return prediction[0];
    } catch (error) {
      this.logger.error(`Fraud prediction failed: ${error.message}`);
      return 0;
    }
  }

  async updateModel(): Promise<void> {
    await this.initializeModel();
  }
}