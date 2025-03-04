import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Subscription } from '../../payments/entities/subscription.entity';
import { SubscriptionPayment } from '../../payments/entities/subscription-payment.entity';
import { SubscriptionService } from '../../payments/services/subscription.service';
import { SubscriptionStatus } from '../../payments/enums/subscription-status.enum';

@Injectable()
export class SubscriptionTask {
  private readonly logger = new Logger(SubscriptionTask.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionPayment)
    private readonly subscriptionPaymentRepository: Repository<SubscriptionPayment>,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async processSubscriptionPayments() {
    this.logger.debug('Processing subscription payments');

    try {
      // Get active subscriptions that need payment processing
      const subscriptions = await this.subscriptionRepository.find({
        where: { status: SubscriptionStatus.ACTIVE },
        relations: ['merchant'],
      });

      for (const subscription of subscriptions) {
        const lastPayment = await this.subscriptionPaymentRepository.findOne({
          where: { subscription: { id: subscription.id } },
          order: { billingPeriodEnd: 'DESC' },
        });

        if (!lastPayment || lastPayment.billingPeriodEnd <= new Date()) {
          await this.subscriptionService.processSubscriptionPayment(subscription);
          this.logger.debug(`Processed payment for subscription ${subscription.id}`);
        }
      }
    } catch (error) {
      this.logger.error('Error processing subscription payments:', error);
    }
  }
}