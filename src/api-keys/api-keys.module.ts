import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKey } from '../database/entities/api-key.entity';
import { ApiKeysService } from './api-keys.service';
import { ApiKeyRotationService } from './services/api-key-rotation.service';
import { ApiKeyValidationService } from './services/api-key-validation.service';
import { ApiKeysController } from './api-keys.controller';
import { MerchantApiKeysController } from './controllers/merchant-api-keys.controller';
import { MerchantsModule } from '../merchants/merchants.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MonitoringModule } from '../monitoring/monitoring.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApiKey]),
    MerchantsModule,
    NotificationsModule,
    MonitoringModule,
  ],
  controllers: [ApiKeysController, MerchantApiKeysController],
  providers: [
    ApiKeysService,
    ApiKeyRotationService,
    ApiKeyValidationService,
  ],
  exports: [
    TypeOrmModule,
    ApiKeysService,
    ApiKeyRotationService,
    ApiKeyValidationService,
  ],
})
export class ApiKeysModule {}