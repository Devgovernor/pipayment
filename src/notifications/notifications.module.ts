import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationTemplate } from './entities/notification-template.entity';
import { InAppNotification } from './entities/in-app-notification.entity';
import { User } from '../database/entities/user.entity';
import { Merchant } from '../database/entities/merchant.entity';
import { TemplateService } from './services/template.service';
import { EmailService } from './services/email.service';
import { SmsService } from './services/sms.service';
import { NotificationService } from './services/notification.service';
import { NotificationPreferencesService } from './services/notification-preferences.service';
import { TemplateController } from './controllers/template.controller';
import { NotificationPreferencesController } from './controllers/notification-preferences.controller';
import { MonitoringModule } from '../monitoring/monitoring.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationTemplate,
      InAppNotification,
      User,
      Merchant,
    ]),
    MonitoringModule,
  ],
  controllers: [
    TemplateController,
    NotificationPreferencesController,
  ],
  providers: [
    TemplateService,
    EmailService,
    SmsService,
    NotificationService,
    NotificationPreferencesService,
  ],
  exports: [
    TemplateService,
    EmailService,
    SmsService,
    NotificationService,
    NotificationPreferencesService,
  ],
})
export class NotificationsModule {}