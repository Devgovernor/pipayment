import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemConfig } from './entities/system-config.entity';
import { SystemConfigService } from './system-config.service';
import { ConfigManagementService } from './services/config-management.service';
import { ConfigValidationService } from './services/config-validation.service';
import { ConfigManagementController } from './controllers/config-management.controller';
import { CacheModule } from '../cache/cache.module';
import { MonitoringModule } from '../monitoring/monitoring.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([SystemConfig]),
    CacheModule,
    MonitoringModule,
  ],
  controllers: [ConfigManagementController],
  providers: [
    SystemConfigService,
    ConfigManagementService,
    ConfigValidationService,
  ],
  exports: [
    SystemConfigService,
    ConfigManagementService,
    ConfigValidationService,
  ],
})
export class ConfigModule {}