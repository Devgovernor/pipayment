import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Merchant } from '../database/entities/merchant.entity';
import { User } from '../database/entities/user.entity';
import { MerchantsService } from './merchants.service';
import { MerchantsController } from './merchants.controller';
import { MerchantProfileController } from './controllers/merchant-profile.controller';
import { MerchantSettingsController } from './controllers/merchant-settings.controller';
import { MerchantProfileService } from './services/merchant-profile.service';
import { MerchantSettingsService } from './services/merchant-settings.service';
import { MonitoringModule } from '../monitoring/monitoring.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Merchant, User]),
    MonitoringModule,
    NotificationsModule,
  ],
  controllers: [
    MerchantsController,
    MerchantProfileController,
    MerchantSettingsController,
  ],
  providers: [
    MerchantsService,
    MerchantProfileService,
    MerchantSettingsService,
  ],
  exports: [
    TypeOrmModule,
    MerchantsService,
    MerchantProfileService,
    MerchantSettingsService,
  ],
})
export class MerchantsModule {}