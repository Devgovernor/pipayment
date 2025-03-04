import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemConfig } from '../entities/system-config.entity';
import { CacheService } from '../../cache/cache.service';
import { MonitoringService } from '../../monitoring/monitoring.service';
import { ConfigValidationService } from './config-validation.service';

@Injectable()
export class ConfigManagementService {
  private readonly logger = new Logger(ConfigManagementService.name);
  private readonly CACHE_KEY_PREFIX = 'system_config:';

  constructor(
    @InjectRepository(SystemConfig)
    private readonly configRepository: Repository<SystemConfig>,
    private readonly cacheService: CacheService,
    private readonly monitoringService: MonitoringService,
    private readonly validationService: ConfigValidationService,
  ) {}

  async getConfig(key: string): Promise<any> {
    try {
      // Try cache first
      const cachedValue = await this.cacheService.get(`${this.CACHE_KEY_PREFIX}${key}`);
      if (cachedValue !== undefined) {
        return cachedValue;
      }

      // Get from database
      const config = await this.configRepository.findOne({ where: { key } });
      if (!config) {
        return null;
      }

      // Cache the value
      await this.cacheService.set(
        `${this.CACHE_KEY_PREFIX}${key}`,
        config.value,
        3600, // 1 hour TTL
      );

      return config.value;
    } catch (error) {
      this.logger.error(`Failed to get config ${key}: ${error.message}`, error.stack);
      this.monitoringService.recordMetric('config.get_error', 1, { key });
      throw error;
    }
  }

  async setConfig(key: string, value: any, userId: string): Promise<void> {
    try {
      // Validate the configuration value
      await this.validationService.validateConfig(key, value);

      const startTime = Date.now();

      // Update or create config
      await this.configRepository.save({
        key,
        value,
        updatedAt: new Date(),
      });

      // Clear cache
      await this.cacheService.del(`${this.CACHE_KEY_PREFIX}${key}`);

      // Record metrics
      this.monitoringService.recordMetric('config.update', 1, {
        key,
        duration: Date.now() - startTime,
      });

      // Record audit log
      await this.monitoringService.logAudit(
        'config_update',
        userId,
        key,
        { oldValue: await this.getConfig(key), newValue: value },
        null,
        'system',
      );

      this.logger.debug(`Config ${key} updated successfully`);
    } catch (error) {
      this.logger.error(`Failed to set config ${key}: ${error.message}`, error.stack);
      this.monitoringService.recordMetric('config.update_error', 1, { key });
      throw error;
    }
  }

  async getAllConfigs(): Promise<Record<string, any>> {
    try {
      const configs = await this.configRepository.find();
      return configs.reduce((acc, config) => ({
        ...acc,
        [config.key]: config.value,
      }), {});
    } catch (error) {
      this.logger.error(`Failed to get all configs: ${error.message}`, error.stack);
      this.monitoringService.recordMetric('config.get_all_error', 1);
      throw error;
    }
  }

  async resetConfig(key: string, userId: string): Promise<void> {
    try {
      const defaultValue = await this.validationService.getDefaultValue(key);
      await this.setConfig(key, defaultValue, userId);

      this.monitoringService.recordMetric('config.reset', 1, { key });
    } catch (error) {
      this.logger.error(`Failed to reset config ${key}: ${error.message}`, error.stack);
      this.monitoringService.recordMetric('config.reset_error', 1, { key });
      throw error;
    }
  }

  async validateAllConfigs(): Promise<{
    valid: boolean;
    errors: Record<string, string>;
  }> {
    const configs = await this.getAllConfigs();
    const errors: Record<string, string> = {};
    let valid = true;

    for (const [key, value] of Object.entries(configs)) {
      try {
        await this.validationService.validateConfig(key, value);
      } catch (error) {
        valid = false;
        errors[key] = error.message;
      }
    }

    return { valid, errors };
  }
}