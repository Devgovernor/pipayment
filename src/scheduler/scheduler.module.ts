import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettlementTask } from './tasks/settlement.task';
import { SubscriptionTask } from './tasks/subscription.task';
import { SettlementsModule } from '../settlements/settlements.module';
import { PaymentsModule } from '../payments/payments.module';
import { Subscription } from '../payments/entities/subscription.entity';
import { SubscriptionPayment } from '../payments/entities/subscription-payment.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.registerQueue({
      name: 'settlements',
    }),
    TypeOrmModule.forFeature([Subscription, SubscriptionPayment]),
    SettlementsModule,
    PaymentsModule,
  ],
  providers: [SettlementTask, SubscriptionTask],
})
export class SchedulerModule {}