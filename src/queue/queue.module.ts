import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { SettlementProcessor } from './processors/settlement.processor';
import { SettlementsModule } from '../settlements/settlements.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'settlements',
    }),
    SettlementsModule,
  ],
  providers: [SettlementProcessor],
})
export class QueueModule {}