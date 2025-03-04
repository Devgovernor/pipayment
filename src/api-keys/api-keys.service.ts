import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from '../database/entities/api-key.entity';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { SecurityUtils } from '../common/utils/security.utils';
import { DateUtils } from '../common/utils/date.utils';

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepository: Repository<ApiKey>,
  ) {}

  async createForMerchant(merchantId: string, createApiKeyDto: CreateApiKeyDto): Promise<ApiKey> {
    // Check if merchant already has an active key with this name
    const existingKey = await this.apiKeyRepository.findOne({
      where: {
        merchant: { id: merchantId },
        name: createApiKeyDto.name,
        isActive: true,
      },
    });

    if (existingKey) {
      throw new ConflictException('API key with this name already exists');
    }

    const apiKey = this.apiKeyRepository.create({
      ...createApiKeyDto,
      merchant: { id: merchantId },
      key: SecurityUtils.generateApiKey(),
      expiresAt: DateUtils.addDays(new Date(), 90), // 90 days validity
    });

    return this.apiKeyRepository.save(apiKey);
  }

  async findByMerchant(merchantId: string): Promise<ApiKey[]> {
    return this.apiKeyRepository.find({
      where: {
        merchant: { id: merchantId },
        isActive: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findByKey(key: string): Promise<ApiKey | null> {
    return this.apiKeyRepository.findOne({
      where: { key, isActive: true },
      relations: ['merchant'],
    });
  }

  async deactivate(id: string): Promise<void> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { id },
    });

    if (!apiKey) {
      throw new NotFoundException(`API key with ID "${id}" not found`);
    }

    apiKey.isActive = false;
    await this.apiKeyRepository.save(apiKey);
  }

  async rotateKey(id: string): Promise<ApiKey> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { id },
    });

    if (!apiKey) {
      throw new NotFoundException(`API key with ID "${id}" not found`);
    }

    apiKey.key = SecurityUtils.generateApiKey();
    apiKey.expiresAt = DateUtils.addDays(new Date(), 90);
    return this.apiKeyRepository.save(apiKey);
  }
}