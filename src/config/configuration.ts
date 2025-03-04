import { registerAs } from '@nestjs/config';
import { join } from 'path';

export const configuration = registerAs('app', () => ({
  environment: process.env.NODE_ENV || 'development',
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  database: {
    type: 'postgres',
    host: process.env.DB_HOST || 'pigateone-ekesonjachimike-a7e5.b.aivencloud.com',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 28046,
    username: process.env.DB_USERNAME || 'avnadmin',
    password: process.env.DB_PASSWORD || 'AVNS_P4xkVGyPmm3gmgiTBxY',
    database: process.env.DB_DATABASE || 'defaultdb',
    ssl: {
      ca: join(process.cwd(), 'ca-certificate.crt'),
      rejectUnauthorized: false
    }
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },
  piNetwork: {
    apiKey: process.env.PI_NETWORK_API_KEY || '',
    apiSecret: process.env.PI_NETWORK_API_SECRET || '',
    webhookSecret: process.env.PI_NETWORK_WEBHOOK_SECRET || '',
    sandbox: process.env.PI_NETWORK_SANDBOX === 'true',
  },
  email: {
    enabled: process.env.EMAIL_ENABLED === 'true',
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 587,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM,
  },
  twilio: {
    enabled: process.env.SMS_ENABLED === 'true',
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
  },
  features: {
    sms: process.env.FEATURE_SMS === 'true',
    email: process.env.FEATURE_EMAIL === 'true',
    otp: process.env.FEATURE_OTP === 'true',
    fraud: process.env.FEATURE_FRAUD === 'true',
    analytics: process.env.FEATURE_ANALYTICS === 'true',
  }
}));