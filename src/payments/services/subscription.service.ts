import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../entities/subscription.entity';
import { SubscriptionPayment } from '../entities/subscription-payment.entity';
import { CreateSubscriptionDto } from '../dto/create-subscription.dto';
import { PaymentsService } from '../payments.service';
import { Merchant } from '../../database/entities/merchant.entity';
import { SubscriptionStatus } from '../enums/subscription-status.enum';
import { DateUtils } from '../../common/utils/date.utils';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionPayment)
    private readonly subscriptionPaymentRepository: Repository<SubscriptionPayment>,
    private readonly paymentsService: PaymentsService,
  ) {}

  async create(merchant: Merchant, createSubscriptionDto: CreateSubscriptionDto): Promise<Subscription> {
    const subscription = this.subscriptionRepository.create({
      ...createSubscriptionDto,
      merchant,
      status: SubscriptionStatus.ACTIVE,
    });

    return this.subscriptionRepository.save(subscription);
  }

  async findOne(id: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id },
      relations: ['merchant'],
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID "${id}" not found`);
    }

    return subscription;
  }

  async findByMerchant(merchantId: string): Promise<Subscription[]> {
    return this.subscriptionRepository.find({
      where: { merchant: { id: merchantId } },
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(id: string, status: SubscriptionStatus): Promise<Subscription> {
    const subscription = await this.findOne(id);
    subscription.status = status;
    return this.subscriptionRepository.save(subscription);
  }

  async processSubscriptionPayment(subscription: Subscription): Promise<SubscriptionPayment> {
    const payment = await this.paymentsService.create({
      amount: subscription.amount,
      currency: subscription.currency,
      merchant: subscription.merchant,
      metadata: {
        subscriptionId: subscription.id,
        type: 'subscription_payment',
      },
    });

    const billingPeriodStart = new Date();
    const billingPeriodEnd = this.calculateNextBillingDate(
      billingPeriodStart,
      subscription.interval,
      subscription.intervalCount,
    );

    const subscriptionPayment = this.subscriptionPaymentRepository.create({
      subscription,
      payment,
      billingPeriodStart,
      billingPeriodEnd,
    });

    return this.subscriptionPaymentRepository.save(subscriptionPayment);
  }

  private calculateNextBillingDate(
    currentDate: Date,
    interval: string,
    count: number,
  ): Date {
    switch (interval) {
      case 'daily':
        return DateUtils.addDays(currentDate, count);
      case 'weekly':
        return DateUtils.addDays(currentDate, count * 7);
      case 'monthly':
        const nextMonth = new Date(currentDate);
        nextMonth.setMonth(nextMonth.getMonth() + count);
        return nextMonth;
      case 'yearly':
        const nextYear = new Date(currentDate);
        nextYear.setFullYear(nextYear.getFullYear() + count);
        return nextYear;
      default:
        throw new Error(`Invalid interval: ${interval}`);
    }
  }
}