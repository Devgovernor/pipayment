import { Injectable, Logger, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketplaceSeller } from '../entities/marketplace-seller.entity';
import { AddSellerDto } from '../dto/add-seller.dto';
import { MarketplacePaymentDto } from '../dto/marketplace-payment.dto';
import { Merchant } from '../../database/entities/merchant.entity';
import { PaymentsService } from '../../payments/payments.service';
import { PaymentSplitService } from '../../payments/services/payment-split.service';
import { CurrencyUtils } from '../../common/utils/currency.utils';
import { MonitoringService } from '../../monitoring/monitoring.service';
import { NotificationService } from '../../notifications/services/notification.service';

@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);

  constructor(
    @InjectRepository(MarketplaceSeller)
    private readonly marketplaceSellerRepository: Repository<MarketplaceSeller>,
    private readonly paymentsService: PaymentsService,
    private readonly paymentSplitService: PaymentSplitService,
    private readonly monitoringService: MonitoringService,
    private readonly notificationService: NotificationService,
  ) {}

  async addSeller(merchant: Merchant, addSellerDto: AddSellerDto): Promise<MarketplaceSeller> {
    try {
      // Check if seller is already added
      const existingSeller = await this.marketplaceSellerRepository.findOne({
        where: {
          merchant: { id: merchant.id },
          seller: { id: addSellerDto.sellerId },
        },
      });

      if (existingSeller) {
        throw new ConflictException('Seller is already added to the marketplace');
      }

      const marketplaceSeller = this.marketplaceSellerRepository.create({
        merchant,
        seller: { id: addSellerDto.sellerId },
        commissionRate: addSellerDto.commissionRate,
        metadata: addSellerDto.metadata,
      });

      const savedSeller = await this.marketplaceSellerRepository.save(marketplaceSeller);

      // Record metric
      this.monitoringService.recordMetric('marketplace.seller_added', 1, {
        merchantId: merchant.id,
        sellerId: addSellerDto.sellerId,
      });

      // Send notification
      await this.notificationService.sendAccountNotification(
        savedSeller.seller.user,
        'Marketplace Access Granted',
        `You have been added as a seller to ${merchant.businessName}'s marketplace`,
        {
          type: 'marketplace_access',
          merchantId: merchant.id,
          commissionRate: addSellerDto.commissionRate,
        },
      );

      return savedSeller;
    } catch (error) {
      this.logger.error(`Failed to add seller: ${error.message}`, error.stack);
      throw error;
    }
  }

  async processMarketplacePayment(
    merchant: Merchant,
    paymentDto: MarketplacePaymentDto,
  ) {
    try {
      // Get seller details
      const marketplaceSeller = await this.marketplaceSellerRepository.findOne({
        where: {
          merchant: { id: merchant.id },
          seller: { id: paymentDto.sellerId },
          isActive: true,
        },
        relations: ['seller'],
      });

      if (!marketplaceSeller) {
        throw new NotFoundException('Seller not found in marketplace');
      }

      // Create the payment
      const payment = await this.paymentsService.create({
        amount: paymentDto.amount,
        currency: paymentDto.currency,
        merchant,
        metadata: {
          type: 'marketplace_payment',
          sellerId: paymentDto.sellerId,
          description: paymentDto.description,
          ...paymentDto.metadata,
        },
      });

      // Calculate commission
      const commission = CurrencyUtils.calculateFee(
        paymentDto.amount,
        marketplaceSeller.commissionRate,
      );

      // Create payment splits
      await this.paymentSplitService.createSplit(payment, {
        recipientId: marketplaceSeller.seller.id,
        amount: paymentDto.amount - commission,
        currency: paymentDto.currency,
        metadata: {
          type: 'seller_split',
          originalAmount: paymentDto.amount,
          commissionRate: marketplaceSeller.commissionRate,
        },
      });

      await this.paymentSplitService.createSplit(payment, {
        recipientId: merchant.id,
        amount: commission,
        currency: paymentDto.currency,
        metadata: {
          type: 'commission_split',
          originalAmount: paymentDto.amount,
          commissionRate: marketplaceSeller.commissionRate,
        },
      });

      // Record metrics
      this.monitoringService.recordMetric('marketplace.payment_processed', 1, {
        merchantId: merchant.id,
        sellerId: paymentDto.sellerId,
        amount: paymentDto.amount,
        commission,
      });

      return payment;
    } catch (error) {
      this.logger.error(`Failed to process marketplace payment: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getSellers(merchantId: string): Promise<MarketplaceSeller[]> {
    return this.marketplaceSellerRepository.find({
      where: { merchant: { id: merchantId }, isActive: true },
      relations: ['seller'],
      order: { createdAt: 'DESC' },
    });
  }

  async removeSeller(merchantId: string, sellerId: string): Promise<void> {
    const marketplaceSeller = await this.marketplaceSellerRepository.findOne({
      where: {
        merchant: { id: merchantId },
        seller: { id: sellerId },
      },
      relations: ['seller', 'seller.user'],
    });

    if (!marketplaceSeller) {
      throw new NotFoundException('Seller not found in marketplace');
    }

    marketplaceSeller.isActive = false;
    await this.marketplaceSellerRepository.save(marketplaceSeller);

    // Record metric
    this.monitoringService.recordMetric('marketplace.seller_removed', 1, {
      merchantId,
      sellerId,
    });

    // Send notification
    await this.notificationService.sendAccountNotification(
      marketplaceSeller.seller.user,
      'Marketplace Access Revoked',
      'Your access to the marketplace has been revoked',
      {
        type: 'marketplace_access_revoked',
        merchantId,
      },
    );
  }

  async updateCommissionRate(
    merchantId: string,
    sellerId: string,
    commissionRate: number,
  ): Promise<MarketplaceSeller> {
    const marketplaceSeller = await this.marketplaceSellerRepository.findOne({
      where: {
        merchant: { id: merchantId },
        seller: { id: sellerId },
      },
      relations: ['seller', 'seller.user'],
    });

    if (!marketplaceSeller) {
      throw new NotFoundException('Seller not found in marketplace');
    }

    const oldRate = marketplaceSeller.commissionRate;
    marketplaceSeller.commissionRate = commissionRate;
    const updatedSeller = await this.marketplaceSellerRepository.save(marketplaceSeller);

    // Record metric
    this.monitoringService.recordMetric('marketplace.commission_updated', 1, {
      merchantId,
      sellerId,
      oldRate,
      newRate: commissionRate,
    });

    // Send notification
    await this.notificationService.sendAccountNotification(
      marketplaceSeller.seller.user,
      'Commission Rate Updated',
      `Your commission rate has been updated to ${commissionRate}%`,
      {
        type: 'commission_update',
        oldRate,
        newRate: commissionRate,
      },
    );

    return updatedSeller;
  }
}