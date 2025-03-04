import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Merchant } from '../../database/entities/merchant.entity';
import { User } from '../../database/entities/user.entity';
import { UpdateSettingsDto } from '../dto/update-settings.dto';
import { MonitoringService } from '../../monitoring/monitoring.service';
import { NotificationService } from '../../notifications/services/notification.service';

@Injectable()
export class MerchantSettingsService {
  constructor(
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly monitoringService: MonitoringService,
    private readonly notificationService: NotificationService,
  ) {}

  async getSettings(merchantId: string) {
    const merchant = await this.merchantRepository.findOne({
      where: { id: merchantId },
      relations: ['user'],
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    return {
      notifications: {
        email: merchant.user.settings?.emailNotifications ?? true,
        sms: merchant.user.settings?.smsNotifications ?? false,
        inApp: merchant.user.settings?.inAppNotifications ?? true,
      },
      webhooks: {
        url: merchant.settings?.webhookUrl,
        enabled: !!merchant.settings?.webhookUrl,
      },
      security: {
        twoFactorEnabled: merchant.user.otpEnabled,
        ipWhitelist: merchant.settings?.ipWhitelist ?? [],
      },
      preferences: {
        timezone: merchant.settings?.timezone ?? 'UTC',
        dateFormat: merchant.settings?.dateFormat ?? 'YYYY-MM-DD',
        currency: merchant.settings?.defaultCurrency ?? 'PI',
      },
    };
  }

  async updateSettings(merchantId: string, updateSettingsDto: UpdateSettingsDto) {
    const merchant = await this.merchantRepository.findOne({
      where: { id: merchantId },
      relations: ['user'],
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    const startTime = Date.now();
    const changes: string[] = [];

    try {
      // Update user notification settings
      if (updateSettingsDto.notifications) {
        const oldSettings = merchant.user.settings || {};
        merchant.user.settings = {
          ...oldSettings,
          emailNotifications: updateSettingsDto.notifications.email,
          smsNotifications: updateSettingsDto.notifications.sms,
          inAppNotifications: updateSettingsDto.notifications.inApp,
        };
        await this.userRepository.save(merchant.user);
        changes.push('notifications');
      }

      // Update merchant settings
      if (updateSettingsDto.webhooks || updateSettingsDto.security || updateSettingsDto.preferences) {
        const oldSettings = merchant.settings || {};
        merchant.settings = {
          ...oldSettings,
          webhookUrl: updateSettingsDto.webhooks?.url,
          ipWhitelist: updateSettingsDto.security?.ipWhitelist,
          timezone: updateSettingsDto.preferences?.timezone,
          dateFormat: updateSettingsDto.preferences?.dateFormat,
          defaultCurrency: updateSettingsDto.preferences?.currency,
        };
        await this.merchantRepository.save(merchant);

        if (updateSettingsDto.webhooks) changes.push('webhooks');
        if (updateSettingsDto.security) changes.push('security');
        if (updateSettingsDto.preferences) changes.push('preferences');
      }

      // Record metrics
      this.monitoringService.recordMetric('merchant.settings_updated', 1, {
        merchantId,
        changes: changes.join(','),
        duration: Date.now() - startTime,
      });

      // Send notification
      if (changes.length > 0) {
        await this.notificationService.sendAccountNotification(
          merchant.user,
          'Settings Updated',
          `Your account settings have been updated: ${changes.join(', ')}`,
          {
            type: 'settings_update',
            changes,
          },
        );
      }

      return this.getSettings(merchantId);
    } catch (error) {
      this.monitoringService.recordMetric('merchant.settings_update_error', 1, {
        merchantId,
        error: error.message,
      });
      throw error;
    }
  }
}