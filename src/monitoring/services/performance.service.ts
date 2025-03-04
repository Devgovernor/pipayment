import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PerformanceService implements OnModuleInit {
  private readonly logger = new Logger(PerformanceService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const licenseKey = this.configService.get<string>('NEW_RELIC_LICENSE_KEY');
    if (!licenseKey) {
      this.logger.warn('New Relic license key not configured - monitoring will be disabled');
      return;
    }

    try {
      require('newrelic');
      this.logger.log('New Relic monitoring initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize New Relic: ${error.message}`);
    }
  }

  recordMetric(name: string, value: number): void {
    try {
      const newrelic = require('newrelic');
      newrelic.recordMetric(name, value);
    } catch (error) {
      this.logger.debug(`Failed to record metric: ${error.message}`);
    }
  }

  recordCustomEvent(eventType: string, attributes: Record<string, any>): void {
    try {
      const newrelic = require('newrelic');
      newrelic.recordCustomEvent(eventType, attributes);
    } catch (error) {
      this.logger.debug(`Failed to record custom event: ${error.message}`);
    }
  }

  startSegment(name: string, record = true): any {
    try {
      const newrelic = require('newrelic');
      return newrelic.startSegment(name, record, () => Promise.resolve(), true);
    } catch (error) {
      this.logger.debug(`Failed to start segment: ${error.message}`);
      return null;
    }
  }

  noticeError(error: Error, customAttributes?: Record<string, any>): void {
    try {
      const newrelic = require('newrelic');
      newrelic.noticeError(error, customAttributes);
    } catch (err) {
      this.logger.debug(`Failed to notice error: ${err.message}`);
    }
  }

  addCustomAttribute(key: string, value: string | number | boolean): void {
    try {
      const newrelic = require('newrelic');
      newrelic.addCustomAttribute(key, value);
    } catch (error) {
      this.logger.debug(`Failed to add custom attribute: ${error.message}`);
    }
  }
}