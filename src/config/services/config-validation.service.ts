import { Injectable } from '@nestjs/common';
import * as Joi from 'joi';

@Injectable()
export class ConfigValidationService {
  private readonly schemas: Record<string, Joi.Schema> = {
    'app.maintenance': Joi.boolean().required(),
    'app.version': Joi.string().pattern(/^\d+\.\d+\.\d+$/).required(),
    'app.features': Joi.object({
      payments: Joi.boolean(),
      refunds: Joi.boolean(),
      disputes: Joi.boolean(),
      analytics: Joi.boolean(),
    }).required(),
    'security.passwordPolicy': Joi.object({
      minLength: Joi.number().min(8).max(128),
      requireNumbers: Joi.boolean(),
      requireSymbols: Joi.boolean(),
      requireUppercase: Joi.boolean(),
      maxAge: Joi.number().min(0),
    }).required(),
    'security.rateLimit': Joi.object({
      enabled: Joi.boolean(),
      maxRequests: Joi.number().min(1),
      windowMs: Joi.number().min(1000),
    }).required(),
    'email.templates': Joi.object({
      enabled: Joi.boolean(),
      path: Joi.string(),
    }).required(),
    'notifications.channels': Joi.object({
      email: Joi.boolean(),
      sms: Joi.boolean(),
      inApp: Joi.boolean(),
    }).required(),
  };

  private readonly defaults: Record<string, any> = {
    'app.maintenance': false,
    'app.version': '1.0.0',
    'app.features': {
      payments: true,
      refunds: true,
      disputes: true,
      analytics: true,
    },
    'security.passwordPolicy': {
      minLength: 8,
      requireNumbers: true,
      requireSymbols: true,
      requireUppercase: true,
      maxAge: 90,
    },
    'security.rateLimit': {
      enabled: true,
      maxRequests: 100,
      windowMs: 60000,
    },
    'email.templates': {
      enabled: true,
      path: 'templates/email',
    },
    'notifications.channels': {
      email: true,
      sms: false,
      inApp: true,
    },
  };

  async validateConfig(key: string, value: any): Promise<void> {
    const schema = this.schemas[key];
    if (!schema) {
      throw new Error(`No validation schema found for config key: ${key}`);
    }

    const { error } = schema.validate(value);
    if (error) {
      throw new Error(`Invalid configuration value for ${key}: ${error.message}`);
    }
  }

  async getDefaultValue(key: string): Promise<any> {
    const defaultValue = this.defaults[key];
    if (defaultValue === undefined) {
      throw new Error(`No default value found for config key: ${key}`);
    }
    return defaultValue;
  }

  getValidationSchema(key: string): Joi.Schema | null {
    return this.schemas[key] || null;
  }
}