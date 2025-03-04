import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KycVerification } from './entities/kyc-verification.entity';
import { KycDocument } from './entities/kyc-document.entity';
import { KycService } from './kyc.service';
import { KycController } from './kyc.controller';
import { MerchantsModule } from '../merchants/merchants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([KycVerification, KycDocument]),
    MerchantsModule,
  ],
  controllers: [KycController],
  providers: [KycService],
  exports: [KycService],
})
export class KycModule {}