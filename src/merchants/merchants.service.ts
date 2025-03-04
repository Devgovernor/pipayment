import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Merchant } from '../database/entities/merchant.entity';
import { CreateMerchantDto } from './dto/create-merchant.dto';

@Injectable()
export class MerchantsService {
  constructor(
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
  ) {}

  async create(createMerchantDto: CreateMerchantDto): Promise<Merchant> {
    const existingMerchant = await this.findByEmail(createMerchantDto.email);
    if (existingMerchant) {
      throw new ConflictException('Merchant with this email already exists');
    }

    const merchant = this.merchantRepository.create(createMerchantDto);
    return this.merchantRepository.save(merchant);
  }

  async findAll(): Promise<Merchant[]> {
    return this.merchantRepository.find({
      relations: ['apiKeys'],
    });
  }

  async findOne(id: string): Promise<Merchant> {
    const merchant = await this.merchantRepository.findOne({
      where: { id },
      relations: ['apiKeys'],
    });

    if (!merchant) {
      throw new NotFoundException(`Merchant with ID "${id}" not found`);
    }

    return merchant;
  }

  async findByEmail(email: string): Promise<Merchant | null> {
    const merchant = await this.merchantRepository.findOne({
      where: { email },
      relations: ['apiKeys'],
    });

    return merchant;
  }

  async updateVerificationStatus(id: string, isVerified: boolean): Promise<Merchant> {
    const merchant = await this.findOne(id);
    merchant.isVerified = isVerified;
    return this.merchantRepository.save(merchant);
  }
}