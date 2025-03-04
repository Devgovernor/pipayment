import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FraudAlert } from './entities/fraud-alert.entity';
import { RiskScore } from './entities/risk-score.entity';
import { FraudPreventionService } from './fraud-prevention.service';
import { FraudRulesService } from './services/fraud-rules.service';
import { DeviceFingerprintService } from './services/device-fingerprint.service';
import { IpIntelligenceService } from './services/ip-intelligence.service';
import { MlFraudDetectionService } from './services/ml-fraud-detection.service';
import { MonitoringModule } from '../monitoring/monitoring.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FraudAlert, RiskScore]),
    MonitoringModule,
  ],
  providers: [
    FraudPreventionService,
    FraudRulesService,
    DeviceFingerprintService,
    IpIntelligenceService,
    MlFraudDetectionService,
  ],
  exports: [
    FraudPreventionService,
    FraudRulesService,
    DeviceFingerprintService,
    IpIntelligenceService,
    MlFraudDetectionService,
  ],
})
export class FraudPreventionModule {}