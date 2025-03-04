import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dispute } from './entities/dispute.entity';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { UpdateDisputeStatusDto } from './dto/update-dispute-status.dto';
import { PaymentsService } from '../payments/payments.service';
import { PaymentStatus } from '../payments/enums/payment-status.enum';
import { DisputeStatus } from './enums/dispute-status.enum';

@Injectable()
export class DisputesService {
  constructor(
    @InjectRepository(Dispute)
    private readonly disputeRepository: Repository<Dispute>,
    private readonly paymentsService: PaymentsService,
  ) {}

  async create(createDisputeDto: CreateDisputeDto): Promise<Dispute> {
    const payment = await this.paymentsService.findOne(createDisputeDto.paymentId);
    
    const dispute = this.disputeRepository.create({
      ...createDisputeDto,
      payment,
    });

    const savedDispute = await this.disputeRepository.save(dispute);

    // Update payment status to indicate dispute
    await this.paymentsService.updateStatus(payment.id, PaymentStatus.DISPUTED);

    return savedDispute;
  }

  async findAll(): Promise<Dispute[]> {
    return this.disputeRepository.find({
      relations: ['payment'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Dispute> {
    const dispute = await this.disputeRepository.findOne({
      where: { id },
      relations: ['payment'],
    });

    if (!dispute) {
      throw new NotFoundException(`Dispute with ID "${id}" not found`);
    }

    return dispute;
  }

  async updateStatus(
    id: string,
    updateDisputeStatusDto: UpdateDisputeStatusDto,
  ): Promise<Dispute> {
    const dispute = await this.findOne(id);
    
    dispute.status = updateDisputeStatusDto.status;
    
    if (updateDisputeStatusDto.resolution) {
      dispute.resolution = updateDisputeStatusDto.resolution;
    }
    
    if (updateDisputeStatusDto.status === DisputeStatus.RESOLVED) {
      dispute.resolvedAt = new Date();
      // Update payment status based on dispute resolution
      await this.paymentsService.updateStatus(
        dispute.payment.id,
        dispute.resolution?.toLowerCase() === 'accepted' 
          ? PaymentStatus.REFUNDED 
          : PaymentStatus.COMPLETED
      );
    }

    return this.disputeRepository.save(dispute);
  }
}