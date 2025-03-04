import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../../database/entities/payment.entity';
import { PaymentStatus } from '../enums/payment-status.enum';
import { PiNetworkService } from './pi-network.service';
import { WebhooksService } from '../../webhooks/webhooks.service';
import { FraudPreventionService } from '../../fraud-prevention/fraud-prevention.service';

@Injectable()
export class PaymentProcessorService {
  private readonly logger = new Logger(PaymentProcessorService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly piNetworkService: PiNetworkService,
    private readonly webhooksService: WebhooksService,
    private readonly fraudPreventionService: FraudPreventionService,
  ) {}

  async processPayment(payment: Payment): Promise<Payment> {
    try {
      // Evaluate payment risk
      const riskEvaluation = await this.fraudPreventionService.evaluatePayment(payment, {
        userAgent: payment.metadata?.userAgent || '',
        ip: payment.metadata?.ipAddress || '',
        headers: payment.metadata?.headers || {},
      });
      
      if (!riskEvaluation.approved) {
        payment.status = PaymentStatus.FAILED;
        payment.metadata = {
          ...payment.metadata,
          failureReason: riskEvaluation.reasons[0] || 'High risk score detected',
          riskScore: riskEvaluation.score,
        };
        return this.paymentRepository.save(payment);
      }

      // Create payment on Pi Network
      const piPayment = await this.piNetworkService.createPayment(
        payment.amount,
        `Payment to ${payment.merchant.businessName}`,
        {
          paymentId: payment.id,
          merchantId: payment.merchant.id,
          ...payment.metadata,
        },
      );

      // Update payment with Pi Network payment ID
      payment.metadata = {
        ...payment.metadata,
        piPaymentId: piPayment.id,
      };
      payment.status = PaymentStatus.PROCESSING;
      
      await this.paymentRepository.save(payment);

      // Notify webhook subscribers
      await this.webhooksService.notifyPaymentUpdate(payment);

      return payment;
    } catch (error) {
      this.logger.error(`Payment processing failed: ${error.message}`, error.stack);
      
      payment.status = PaymentStatus.FAILED;
      payment.metadata = {
        ...payment.metadata,
        failureReason: error.message,
      };
      
      await this.paymentRepository.save(payment);
      await this.webhooksService.notifyPaymentUpdate(payment);
      
      throw error;
    }
  }
}