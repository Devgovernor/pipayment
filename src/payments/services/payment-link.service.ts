import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentLink } from '../entities/payment-link.entity';
import { CreatePaymentLinkDto } from '../dto/create-payment-link.dto';
import { Merchant } from '../../database/entities/merchant.entity';
import { SecurityUtils } from '../../common/utils/security.utils';

@Injectable()
export class PaymentLinkService {
  constructor(
    @InjectRepository(PaymentLink)
    private readonly paymentLinkRepository: Repository<PaymentLink>,
  ) {}

  async create(merchant: Merchant, createPaymentLinkDto: CreatePaymentLinkDto): Promise<PaymentLink> {
    const slug = createPaymentLinkDto.slug || this.generateSlug(createPaymentLinkDto.title);
    
    const existingLink = await this.paymentLinkRepository.findOne({
      where: { slug },
    });

    if (existingLink) {
      throw new ConflictException('Payment link with this slug already exists');
    }

    const paymentLink = this.paymentLinkRepository.create({
      ...createPaymentLinkDto,
      merchant,
      slug,
    });

    return this.paymentLinkRepository.save(paymentLink);
  }

  async findOne(id: string): Promise<PaymentLink> {
    const paymentLink = await this.paymentLinkRepository.findOne({
      where: { id },
      relations: ['merchant'],
    });

    if (!paymentLink) {
      throw new NotFoundException(`Payment link with ID "${id}" not found`);
    }

    return paymentLink;
  }

  async findBySlug(slug: string): Promise<PaymentLink> {
    const paymentLink = await this.paymentLinkRepository.findOne({
      where: { slug, isActive: true },
      relations: ['merchant'],
    });

    if (!paymentLink) {
      throw new NotFoundException(`Payment link not found`);
    }

    return paymentLink;
  }

  async findByMerchant(merchantId: string): Promise<PaymentLink[]> {
    return this.paymentLinkRepository.find({
      where: { merchant: { id: merchantId } },
      order: { createdAt: 'DESC' },
    });
  }

  async deactivate(id: string): Promise<void> {
    const paymentLink = await this.findOne(id);
    paymentLink.isActive = false;
    await this.paymentLinkRepository.save(paymentLink);
  }

  private generateSlug(title: string): string {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    const uniqueId = SecurityUtils.generateSecureToken(6);
    return `${baseSlug}-${uniqueId}`;
  }
}