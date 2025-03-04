import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Merchant } from '../../database/entities/merchant.entity';
import { UpdateNotificationPreferencesDto } from '../dto/update-notification-preferences.dto';
import { MonitoringService } from '../../monitoring/monitoring.service';

@Injectable()
export class NotificationPreferencesService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
    private readonly monitoringService: MonitoringService,
  ) {}

  async getPreferences(merchantId: string) {
    const merchant = await this.merchantRepository.findOne({
      where: { id: merchantId },
      relations: ['user'],
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    return {
      channels: {
        email: merchant.user.settings?.emailNotifications ?? true,
        sms: merchant.user.settings?.smsNotifications ?? false,
        inApp: merchant.user.settings?.inAppNotifications ?? true,
      },
      events: {
        payments: merchant.settings?.notificationEvents?.payments ?? true,
        refunds: merchant.settings?.notificationEvents?.refunds ?? true,
        disputes: merchant.settings?.notificationEvents?.disputes ?? true,
        settlements: merchant.settings?.notificationEvents?.settlements ?? true,
      },
    };
  }

  async updatePreferences(
    merchantId: string,
    updatePreferencesDto: UpdateNotificationPreferencesDto,
  ) {
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
      // Update user notification channels
      if (updatePreferencesDto.channels) {
        merchant.user.settings = {
          ...merchant.user.settings,
          emailNotifications: updatePreferencesDto.channels.email,
          smsNotifications: updatePreferencesDto.channels.sms,
          inAppNotifications: updatePreferencesDto.channels.inApp,
        };
        await this.userRepository.save(merchant.user);
        changes.push('channels');
      }

      // Update merchant notification events
      if (updatePreferencesDto.events) {
        merchant.settings = {
          ...merchant.settings,
          notificationEvents: {
            ...merchant.settings?.notificationEvents,
            ...updatePreferencesDto.events,
          },
        };
        await this.merchantRepository.save(merchant);
        changes.push('events');
      }

      // Record metrics
      this.monitoringService.recordMetric('merchant.notification_preferences_updated', 1, {
        merchantId,
        changes: changes.join(','),
        duration: Date.now() - startTime,
      });

      return this.getPreferences(merchantId);
    } catch (error) {
      this.monitoringService.recordMetric('merchant.notification_preferences_error', 1, {
        merchantId,
        error: error.message,
      });
      throw error;
    }
  }
}