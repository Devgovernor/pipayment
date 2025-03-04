import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemConfig } from './entities/system-config.entity';

@Injectable()
export class SystemConfigService {
  private config: Record<string, any> = {};

  constructor(
    @InjectRepository(SystemConfig)
    private readonly systemConfigRepository: Repository<SystemConfig>,
  ) {
    this.loadConfig();
  }

  private async loadConfig() {
    const configs = await this.systemConfigRepository.find();
    this.config = configs.reduce((acc, curr) => ({
      ...acc,
      [curr.key]: curr.value,
    }), {});
  }

  async getConfig(): Promise<Record<string, any>> {
    return this.config;
  }

  async updateConfig(newConfig: Record<string, any>): Promise<void> {
    for (const [key, value] of Object.entries(newConfig)) {
      await this.systemConfigRepository.save({
        key,
        value,
        updatedAt: new Date(),
      });
    }
    await this.loadConfig();
  }

  async setMaintenanceMode(enabled: boolean): Promise<void> {
    await this.updateConfig({
      maintenanceMode: enabled,
    });
  }

  isMaintenanceMode(): boolean {
    return this.config.maintenanceMode === true;
  }
}