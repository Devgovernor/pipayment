import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookEndpoint } from './entities/webhook-endpoint.entity';
import { WebhookDelivery } from './entities/webhook-delivery.entity';
import { WebhookDeliveryService } from './services/webhook-delivery.service';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';
import { PaymentsService } from '../payments/payments.service';
import { RefundsService } from '../refunds/refunds.service';
import { DisputesService } from '../disputes/disputes.service';
import { PaymentStatus } from '../payments/enums/payment-status.enum';
import { RefundStatus } from '../refunds/enums/refund-status.enum';
import { DisputeStatus } from '../disputes/enums/dispute-status.enum';
import { Payment } from '../database/entities/payment.entity';
import { CreateWebhookEndpointDto } from './dto/create-webhook-endpoint.dto';
import { Merchant } from '../database/entities/merchant.entity';
import { SecurityUtils } from '../common/utils/security.utils';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectRepository(WebhookEndpoint)
    private readonly webhookEndpointRepository: Repository<WebhookEndpoint>,
    @InjectRepository(WebhookDelivery)
    private readonly webhookDeliveryRepository: Repository<WebhookDelivery>,
    private readonly webhookDeliveryService: WebhookDeliveryService,
    private readonly paymentsService: PaymentsService,
    private readonly refundsService: RefundsService,
    private readonly disputesService: DisputesService,
  ) {}

  async createEndpoint(merchant: Merchant, createEndpointDto: CreateWebhookEndpointDto): Promise<WebhookEndpoint> {
    const endpoint = this.webhookEndpointRepository.create({
      ...createEndpointDto,
      merchant,
      secret: SecurityUtils.generateSecureToken(),
    });
    return this.webhookEndpointRepository.save(endpoint);
  }

  async findEndpointsByMerchant(merchantId: string): Promise<WebhookEndpoint[]> {
    return this.webhookEndpointRepository.find({
      where: { merchant: { id: merchantId }, isActive: true },
    });
  }

  async deleteEndpoint(merchantId: string, endpointId: string): Promise<void> {
    await this.webhookEndpointRepository.update(
      { id: endpointId, merchant: { id: merchantId } },
      { isActive: false },
    );
  }

  async findDeliveriesByMerchant(merchantId: string): Promise<WebhookDelivery[]> {
    return this.webhookDeliveryRepository.find({
      where: { endpoint: { merchant: { id: merchantId } } },
      relations: ['endpoint'],
      order: { createdAt: 'DESC' },
    });
  }

  async sendTestWebhook(merchantId: string, endpointId: string): Promise<void> {
    const endpoint = await this.webhookEndpointRepository.findOne({
      where: { id: endpointId, merchant: { id: merchantId } },
    });

    if (!endpoint) {
      throw new Error('Webhook endpoint not found');
    }

    await this.webhookDeliveryService.deliverWebhook(
      endpoint,
      'test',
      {
        event: 'test',
        timestamp: new Date().toISOString(),
      },
    );
  }

  async notifyPaymentUpdate(payment: Payment): Promise<void> {
    const endpoints = await this.findEndpointsByMerchant(payment.merchant.id);
    
    for (const endpoint of endpoints) {
      await this.webhookDeliveryService.deliverWebhook(
        endpoint,
        'payment.updated',
        {
          event: 'payment.updated',
          resource_id: payment.id,
          status: payment.status,
          data: {
            amount: payment.amount,
            currency: payment.currency,
            metadata: payment.metadata,
          },
        },
      );
    }
  }

  async handlePaymentWebhook(payload: WebhookPayloadDto): Promise<void> {
    try {
      await this.paymentsService.updateStatus(
        payload.resource_id,
        this.mapPaymentStatus(payload.status),
      );
    } catch (error) {
      this.logger.error(`Error processing payment webhook: ${error.message}`, error.stack);
      throw error;
    }
  }

  async handleRefundWebhook(payload: WebhookPayloadDto): Promise<void> {
    try {
      await this.refundsService.updateStatus(
        payload.resource_id,
        this.mapRefundStatus(payload.status),
      );
    } catch (error) {
      this.logger.error(`Error processing refund webhook: ${error.message}`, error.stack);
      throw error;
    }
  }

  async handleDisputeWebhook(payload: WebhookPayloadDto): Promise<void> {
    try {
      await this.disputesService.updateStatus(
        payload.resource_id,
        {
          status: this.mapDisputeStatus(payload.status),
          resolution: payload.data?.resolution,
        },
      );
    } catch (error) {
      this.logger.error(`Error processing dispute webhook: ${error.message}`, error.stack);
      throw error;
    }
  }

  private mapPaymentStatus(status: string): PaymentStatus {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return PaymentStatus.COMPLETED;
      case 'failed':
      case 'error':
        return PaymentStatus.FAILED;
      case 'cancelled':
        return PaymentStatus.CANCELLED;
      case 'refunded':
        return PaymentStatus.REFUNDED;
      case 'disputed':
        return PaymentStatus.DISPUTED;
      default:
        return PaymentStatus.PENDING;
    }
  }

  private mapRefundStatus(status: string): RefundStatus {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return RefundStatus.COMPLETED;
      case 'failed':
      case 'error':
        return RefundStatus.FAILED;
      case 'processing':
        return RefundStatus.PROCESSING;
      default:
        return RefundStatus.PENDING;
    }
  }

  private mapDisputeStatus(status: string): DisputeStatus {
    switch (status.toLowerCase()) {
      case 'resolved':
        return DisputeStatus.RESOLVED;
      case 'closed':
        return DisputeStatus.CLOSED;
      case 'under_review':
        return DisputeStatus.UNDER_REVIEW;
      default:
        return DisputeStatus.OPEN;
    }
  }
}