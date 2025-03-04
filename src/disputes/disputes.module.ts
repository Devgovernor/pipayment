import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dispute } from './entities/dispute.entity';
import { DisputeEvidence } from './entities/dispute-evidence.entity';
import { DisputeComment } from './entities/dispute-comment.entity';
import { DisputeHistory } from './entities/dispute-history.entity';
import { DisputesService } from './disputes.service';
import { DisputeResolutionService } from './services/dispute-resolution.service';
import { DisputesController } from './disputes.controller';
import { DisputeResolutionController } from './controllers/dispute-resolution.controller';
import { PaymentsModule } from '../payments/payments.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MonitoringModule } from '../monitoring/monitoring.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Dispute,
      DisputeEvidence,
      DisputeComment,
      DisputeHistory,
    ]),
    PaymentsModule,
    NotificationsModule,
    MonitoringModule,
  ],
  controllers: [DisputesController, DisputeResolutionController],
  providers: [DisputesService, DisputeResolutionService],
  exports: [DisputesService, DisputeResolutionService],
})
export class DisputesModule {}