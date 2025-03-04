import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../database/entities/transaction.entity';
import { Payment } from '../database/entities/payment.entity';
import { Refund } from '../refunds/entities/refund.entity';
import { TransactionType } from './enums/transaction-type.enum';
import { TransactionStatus } from './enums/transaction-status.enum';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async createPaymentTransaction(payment: Payment): Promise<Transaction> {
    const transaction = this.transactionRepository.create({
      amount: payment.amount,
      currency: payment.currency,
      type: TransactionType.PAYMENT,
      status: TransactionStatus.PENDING,
      payment,
      metadata: payment.metadata,
    });

    return this.transactionRepository.save(transaction);
  }

  async createRefundTransaction(payment: Payment, refund: Refund): Promise<Transaction> {
    const transaction = this.transactionRepository.create({
      amount: refund.amount,
      currency: payment.currency,
      type: TransactionType.REFUND,
      status: TransactionStatus.PENDING,
      payment,
      metadata: {
        refundId: refund.id,
        reason: refund.reason,
        ...refund.metadata,
      },
    });

    return this.transactionRepository.save(transaction);
  }

  async updateTransactionStatus(
    id: string,
    status: TransactionStatus,
  ): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
    });

    if (!transaction) {
      throw new Error(`Transaction with ID "${id}" not found`);
    }

    transaction.status = status;
    return this.transactionRepository.save(transaction);
  }

  async findByPayment(paymentId: string): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { payment: { id: paymentId } },
      order: { createdAt: 'DESC' },
    });
  }
}