import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KycVerification } from './entities/kyc-verification.entity';
import { CreateKycVerificationDto } from './dto/create-kyc-verification.dto';
import { UpdateKycStatusDto } from './dto/update-kyc-status.dto';
import { KycStatus } from './enums/kyc-status.enum';
import { MerchantsService } from '../merchants/merchants.service';

@Injectable()
export class KycService {
  constructor(
    @InjectRepository(KycVerification)
    private readonly kycVerificationRepository: Repository<KycVerification>,
    private readonly merchantsService: MerchantsService,
  ) {}

  async create(
    merchantId: string,
    createKycVerificationDto: CreateKycVerificationDto,
  ): Promise<KycVerification> {
    const merchant = await this.merchantsService.findOne(merchantId);

    // Check if merchant already has a KYC verification
    const existingVerification = await this.kycVerificationRepository.findOne({
      where: { merchant: { id: merchantId } },
    });

    if (existingVerification) {
      throw new BadRequestException('Merchant already has a KYC verification');
    }

    const verification = this.kycVerificationRepository.create({
      ...createKycVerificationDto,
      merchant,
      status: KycStatus.PENDING,
    });

    return this.kycVerificationRepository.save(verification);
  }

  async findAll(): Promise<KycVerification[]> {
    return this.kycVerificationRepository.find({
      relations: ['merchant', 'documents'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<KycVerification> {
    const verification = await this.kycVerificationRepository.findOne({
      where: { id },
      relations: ['merchant', 'documents'],
    });

    if (!verification) {
      throw new NotFoundException(`KYC verification with ID "${id}" not found`);
    }

    return verification;
  }

  async updateStatus(
    id: string,
    updateKycStatusDto: UpdateKycStatusDto,
  ): Promise<KycVerification> {
    const verification = await this.findOne(id);
    
    verification.status = updateKycStatusDto.status;
    
    if (updateKycStatusDto.status === KycStatus.REJECTED && updateKycStatusDto.rejectionReason) {
      verification.rejectionReason = updateKycStatusDto.rejectionReason;
    }

    if (updateKycStatusDto.status === KycStatus.APPROVED) {
      verification.verifiedAt = new Date();
      // Update merchant verification status
      await this.merchantsService.updateVerificationStatus(verification.merchant.id, true);
    }

    return this.kycVerificationRepository.save(verification);
  }
}