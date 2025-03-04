import { Injectable } from '@nestjs/common';
import { VirtualTerminalPaymentDto } from '../dto/virtual-terminal-payment.dto';
import { PaymentsService } from '../payments.service';
import { Payment } from '../../database/entities/payment.entity';
import { Merchant } from '../../database/entities/merchant.entity';

@Injectable()
export class VirtualTerminalService {
  constructor(private readonly paymentsService: PaymentsService) {}

  async processPayment(
    merchant: Merchant,
    paymentDto: VirtualTerminalPaymentDto,
  ): Promise<Payment> {
    // Create payment with virtual terminal metadata
    return this.paymentsService.create({
      amount: paymentDto.amount,
      currency: paymentDto.currency,
      merchant,
      metadata: {
        source: 'virtual_terminal',
        customerEmail: paymentDto.customerEmail,
        customerPhone: paymentDto.customerPhone,
        customerName: paymentDto.customerName,
        description: paymentDto.description,
        ...paymentDto.metadata,
      },
    });
  }
}