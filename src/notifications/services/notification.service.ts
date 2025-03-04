import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InAppNotification, NotificationType, NotificationPriority } from '../entities/in-app-notification.entity';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { User } from '../../database/entities/user.entity';
import { MonitoringService } from '../../monitoring/monitoring.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(InAppNotification)
    private readonly notificationRepository: Repository<InAppNotification>,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly monitoringService: MonitoringService,
  ) {}

  async broadcastSystemNotification(
    title: string,
    message: string,
    severity: 'info' | 'warning' | 'critical',
  ): Promise<void> {
    const priority = severity === 'critical' ? NotificationPriority.HIGH :
                    severity === 'warning' ? NotificationPriority.MEDIUM :
                    NotificationPriority.LOW;

    const notification = this.notificationRepository.create({
      title,
      message,
      type: NotificationType.SYSTEM,
      priority,
    });

    await this.notificationRepository.save(notification);
  }

  async sendSecurityNotification(
    user: User,
    title: string,
    message: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.sendNotification(
      user,
      title,
      message,
      NotificationType.SECURITY,
      NotificationPriority.HIGH,
      metadata,
    );
  }

  async sendTransactionNotification(
    user: User,
    title: string,
    message: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.sendNotification(
      user,
      title,
      message,
      NotificationType.TRANSACTION,
      NotificationPriority.MEDIUM,
      metadata,
    );
  }

  async sendAccountNotification(
    user: User,
    title: string,
    message: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.sendNotification(
      user,
      title,
      message,
      NotificationType.ACCOUNT,
      NotificationPriority.MEDIUM,
      metadata,
    );
  }

  private async sendNotification(
    user: User,
    title: string,
    message: string,
    type: NotificationType,
    priority: NotificationPriority,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      // Create in-app notification
      const notification = this.notificationRepository.create({
        user,
        title,
        message,
        type,
        priority,
        metadata,
      });
      await this.notificationRepository.save(notification);

      // Send email if enabled
      if (user.settings?.emailNotifications) {
        await this.emailService.sendTemplatedEmail(
          user.email,
          'notification',
          {
            title,
            message,
            type,
            priority,
          },
        );
      }

      // Send SMS if enabled and it's a high-priority notification
      if (
        user.settings?.smsNotifications &&
        priority === NotificationPriority.HIGH &&
        user.phoneNumber
      ) {
        await this.smsService.sendTemplatedSms(
          user.phoneNumber,
          'notification',
          {
            title,
            message,
          },
        );
      }

      // Log notification for monitoring
      await this.monitoringService.logAudit(
        'notification_sent',
        user.id,
        notification.id,
        {
          type,
          priority,
          channels: [
            'in_app',
            user.settings?.emailNotifications && 'email',
            user.settings?.smsNotifications && priority === NotificationPriority.HIGH && 'sms',
          ].filter(Boolean),
        },
        user.id,
        'system',
      );
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    await this.notificationRepository.update(
      { id: notificationId, user: { id: userId } },
      { read: true },
    );
  }

  async getUnreadNotifications(userId: string): Promise<InAppNotification[]> {
    return this.notificationRepository.find({
      where: {
        user: { id: userId },
        read: false,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }
}