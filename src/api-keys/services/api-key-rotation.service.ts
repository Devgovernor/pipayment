import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ApiKey } from '../../database/entities/api-key.entity';
import { EmailService } from '../../notifications/services/email.service';
import { DateUtils } from '../../common/utils/date.utils';
import { SecurityUtils } from '../../common/utils/security.utils';

@Injectable()
export class ApiKeyRotationService {
  private readonly logger = new Logger(ApiKeyRotationService.name);

  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepository: Repository<ApiKey>,
    private readonly emailService: EmailService,
  ) {}

  async checkForExpiringKeys(): Promise<void> {
    const thirtyDaysFromNow = DateUtils.addDays(new Date(), 30);
    
    const expiringKeys = await this.apiKeyRepository.find({
      where: {
        expiresAt: LessThan(thirtyDaysFromNow),
        isActive: true,
      },
      relations: ['merchant'],
    });

    for (const key of expiringKeys) {
      try {
        // Generate new key
        const newKey = await this.rotateKey(key.id);

        // Send notification
        await this.emailService.sendTemplatedEmail(
          key.merchant.email,
          'api-key-rotation',
          {
            currentKey: key.key,
            newKey: newKey.key,
            expiryDate: key.expiresAt.toISOString(),
            daysUntilExpiry: Math.ceil(
              (key.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            ),
          },
        );

        this.logger.debug(`Rotated API key ${key.id} for merchant ${key.merchant.id}`);
      } catch (error) {
        this.logger.error(
          `Failed to rotate API key ${key.id}: ${error.message}`,
          error.stack,
        );
      }
    }
  }

  async rotateKey(keyId: string): Promise<ApiKey> {
    const key = await this.apiKeyRepository.findOne({
      where: { id: keyId },
      relations: ['merchant'],
    });

    if (!key) {
      throw new Error(`API key ${keyId} not found`);
    }

    // Create new key
    const newKey = this.apiKeyRepository.create({
      merchant: key.merchant,
      name: `${key.name} (Rotated)`,
      key: SecurityUtils.generateApiKey(),
      expiresAt: DateUtils.addDays(new Date(), 90), // 90 days validity
    });

    await this.apiKeyRepository.save(newKey);

    // Deactivate old key after 30 days
    const deactivationDate = DateUtils.addDays(new Date(), 30);
    key.expiresAt = deactivationDate;
    await this.apiKeyRepository.save(key);

    return newKey;
  }
}