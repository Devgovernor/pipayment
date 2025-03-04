import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentSplit } from '../entities/payment-split.entity';
import { CreatePaymentSplitDto } from '../dto/create-payment-split.dto';
import { Payment } from '../../database/entities/payment.entity';
import { MerchantsService } from '../../merchants/merchants.service';
import { CurrencyUtils } from '../../common/utils/currency.utils';

@Injectable()
export class PaymentSplitService {
  constructor(
    @InjectRepository(PaymentSplit)
    private readonly paymentSplitRepository: Repository<PaymentSplit>,
    private readonly merchantsService: MerchantsService,
  ) {}

  async createSplit(
    payment: Payment,
    createPaymentSplitDto: CreatePaymentSplitDto,
  ): Promise<PaymentSplit> {
    const recipient = await this.merchantsService.findOne(createPaymentSplitDto.recipientId);

    const split = this.paymentSplitRepository.create({
      payment,
      recipient,
      amount: createPaymentSplitDto.amount,
      currency: createPaymentSplitDto.currency,
      feePercentage: createPaymentSplitDto.feePercentage || 0,
      metadata: createPaymentSplitDto.metadata,
    });

    return this.paymentSplitRepository.save(split);
  }

  async findByPayment(paymentId: string): Promise<PaymentSplit[]> {
    return this.paymentSplitRepository.find({
      where: { payment: { id: paymentId } },
      relations: ['recipient'],
    });
  }

  async calculateSplitAmount(split: PaymentSplit): Promise<number> {
    const fee = CurrencyUtils.calculateFee(split.amount, split.feePercentage);
    return split.amount - fee;
  }
}