import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Refund } from './entities/refund.entity';
import { CreateRefundDto } from './dto/create-refund.dto';
import { RefundStatus } from './enums/refund-status.enum';
import { PaymentsService } from '../payments/payments.service';
import { TransactionsService } from '../transactions/transactions.service';
import { PaymentStatus } from '../payments/enums/payment-status.enum';
import { TransactionType } from '../transactions/enums/transaction-type.enum';

@Injectable()
export class RefundsService {
  constructor(
    @InjectRepository(Refund)
    private readonly refundRepository: Repository<Refund>,
    private readonly paymentsService: PaymentsService,
    private readonly transactionsService: TransactionsService,
  ) {}

  async create(createRefundDto: CreateRefundDto): Promise<Refund> {
    const payment = await this.paymentsService.findOne(createRefundDto.paymentId);

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Can only refund completed payments');
    }

    // Check if refund amount is valid
    const existingRefunds = await this.refundRepository.find({
      where: { payment: { id: payment.id } },
    });
    
    const totalRefunded = existingRefunds.reduce((sum, refund) => sum + refund.amount, 0);
    if (totalRefunded + createRefundDto.amount > payment.amount) {
      throw new BadRequestException('Refund amount exceeds payment amount');
    }

    const refund = this.refundRepository.create({
      ...createRefundDto,
      payment,
      status: RefundStatus.PENDING,
    });

    const savedRefund = await this.refundRepository.save(refund);

    // Create refund transaction
    await this.transactionsService.createRefundTransaction(payment, savedRefund);

    if (totalRefunded + createRefundDto.amount === payment.amount) {
      await this.paymentsService.updateStatus(payment.id, PaymentStatus.REFUNDED);
    }

    return savedRefund;
  }

  async findAll(): Promise<Refund[]> {
    return this.refundRepository.find({
      relations: ['payment'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Refund> {
    const refund = await this.refundRepository.findOne({
      where: { id },
      relations: ['payment'],
    });

    if (!refund) {
      throw new NotFoundException(`Refund with ID "${id}" not found`);
    }

    return refund;
  }

  async updateStatus(id: string, status: RefundStatus): Promise<Refund> {
    const refund = await this.findOne(id);
    refund.status = status;
    return this.refundRepository.save(refund);
  }
}