import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from '../../database/entities/api-key.entity';
import { MonitoringService } from '../../monitoring/monitoring.service';

@Injectable()
export class ApiKeyValidationService {
  private readonly logger = new Logger(ApiKeyValidationService.name);

  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepository: Repository<ApiKey>,
    private readonly monitoringService: MonitoringService,
  ) {}

  async validateKey(key: string): Promise<ApiKey | null> {
    try {
      const apiKey = await this.apiKeyRepository.findOne({
        where: {
          key,
          isActive: true,
        },
        relations: ['merchant'],
      });

      if (!apiKey) {
        this.monitoringService.recordMetric('api_key.invalid', 1);
        return null;
      }

      // Check expiration
      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        this.monitoringService.recordMetric('api_key.expired', 1);
        return null;
      }

      // Update last used timestamp
      apiKey.lastUsedAt = new Date();
      await this.apiKeyRepository.save(apiKey);

      this.monitoringService.recordMetric('api_key.valid', 1);
      return apiKey;
    } catch (error) {
      this.logger.error(`API key validation failed: ${error.message}`, error.stack);
      this.monitoringService.recordMetric('api_key.error', 1);
      return null;
    }
  }

  async trackUsage(apiKey: ApiKey): Promise<void> {
    try {
      // Record usage metrics
      this.monitoringService.recordMetric('api_key.usage', 1, {
        merchantId: apiKey.merchant.id,
        keyId: apiKey.id,
      });

      // Check for suspicious activity
      const recentUsageCount = await this.getRecentUsageCount(apiKey.id);
      if (recentUsageCount > 1000) { // More than 1000 requests in 5 minutes
        this.monitoringService.recordMetric('api_key.suspicious_activity', 1);
        this.logger.warn(`Suspicious activity detected for API key ${apiKey.id}`);
      }
    } catch (error) {
      this.logger.error(`Failed to track API key usage: ${error.message}`, error.stack);
    }
  }

  private async getRecentUsageCount(keyId: string): Promise<number> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const count = await this.apiKeyRepository.createQueryBuilder()
      .where('id = :keyId', { keyId })
      .andWhere('last_used_at > :fiveMinutesAgo', { fiveMinutesAgo })
      .getCount();

    return count;
  }
}