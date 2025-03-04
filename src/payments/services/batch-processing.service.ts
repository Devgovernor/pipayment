import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BatchPaymentDto } from '../dto/batch-payment.dto';
import { PaymentsService } from '../payments.service';
import { Payment } from '../../database/entities/payment.entity';
import { Merchant } from '../../database/entities/merchant.entity';
import { BatchPayment } from '../entities/batch-payment.entity';

@Injectable()
export class BatchProcessingService {
  constructor(
    @InjectRepository(BatchPayment)
    private readonly batchPaymentRepository: Repository<BatchPayment>,
    private readonly paymentsService: PaymentsService,
  ) {}

  async processBatch(
    merchant: Merchant,
    batchDto: BatchPaymentDto,
  ): Promise<BatchPayment> {
    // Calculate total amount
    const totalAmount = batchDto.items.reduce((sum, item) => sum + item.amount, 0);

    // Create batch payment record
    const batchPayment = this.batchPaymentRepository.create({
      merchant,
      fileName: `batch_${new Date().toISOString()}`,
      totalAmount,
      currency: batchDto.currency,
      status: 'processing',
      totalCount: batchDto.items.length,
      metadata: batchDto.metadata,
    });

    await this.batchPaymentRepository.save(batchPayment);

    try {
      // Process each payment
      for (const item of batchDto.items) {
        await this.paymentsService.create({
          amount: item.amount,
          currency: batchDto.currency,
          merchant,
          metadata: {
            batchId: batchPayment.id,
            description: item.description,
            recipientId: item.recipientId,
            ...item.metadata,
          },
        });

        // Update processed count
        batchPayment.processedCount++;
        await this.batchPaymentRepository.save(batchPayment);
      }

      // Update batch status to completed
      batchPayment.status = 'completed';
      return this.batchPaymentRepository.save(batchPayment);
    } catch (error) {
      // Store error and update status
      batchPayment.status = 'failed';
      batchPayment.errors = {
        message: error.message,
        timestamp: new Date().toISOString(),
      };
      return this.batchPaymentRepository.save(batchPayment);
    }
  }

  async getBatchStatus(batchId: string): Promise<BatchPayment> {
    const batch = await this.batchPaymentRepository.findOne({
      where: { id: batchId },
      relations: ['merchant'],
    });

    if (!batch) {
      throw new BadRequestException(`Batch payment with ID "${batchId}" not found`);
    }

    return batch;
  }
}