import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookDelivery } from '../entities/webhook-delivery.entity';
import { WebhookEndpoint } from '../entities/webhook-endpoint.entity';
import { createHmac } from 'crypto';

@Injectable()
export class WebhookDeliveryService {
  private readonly logger = new Logger(WebhookDeliveryService.name);
  private readonly maxRetries = 3;

  constructor(
    @InjectRepository(WebhookDelivery)
    private readonly deliveryRepository: Repository<WebhookDelivery>,
    @InjectRepository(WebhookEndpoint)
    private readonly endpointRepository: Repository<WebhookEndpoint>,
  ) {}

  private generateSignature(payload: string, secret: string): string {
    return createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  async deliverWebhook(
    endpoint: WebhookEndpoint,
    event: string,
    payload: any,
  ): Promise<WebhookDelivery> {
    const delivery = this.deliveryRepository.create({
      endpoint,
      event,
      payload,
      attempts: 0,
    });

    try {
      const payloadString = JSON.stringify(payload);
      const signature = this.generateSignature(payloadString, endpoint.secret);

      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Event-Type': event,
        },
        body: payloadString,
      });

      delivery.statusCode = response.status;
      delivery.success = response.ok;
      delivery.response = await response.text();
    } catch (error) {
      delivery.success = false;
      delivery.error = error.message;
      this.logger.error(`Webhook delivery failed: ${error.message}`, error.stack);
    }

    delivery.attempts += 1;
    await this.deliveryRepository.save(delivery);

    if (!delivery.success && delivery.attempts < this.maxRetries) {
      // Schedule retry
      setTimeout(() => {
        this.retryDelivery(delivery.id);
      }, Math.pow(2, delivery.attempts) * 1000); // Exponential backoff
    }

    return delivery;
  }

  private async retryDelivery(deliveryId: string): Promise<void> {
    const delivery = await this.deliveryRepository.findOne({
      where: { id: deliveryId },
      relations: ['endpoint'],
    });

    if (!delivery || delivery.success || delivery.attempts >= this.maxRetries) {
      return;
    }

    await this.deliverWebhook(
      delivery.endpoint,
      delivery.event,
      delivery.payload,
    );
  }
}