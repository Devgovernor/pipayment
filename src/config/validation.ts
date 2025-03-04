import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('1h'),
  PI_NETWORK_API_KEY: Joi.string().required(),
  PI_NETWORK_API_SECRET: Joi.string().required(),
  PI_NETWORK_WEBHOOK_SECRET: Joi.string().required(),
  PI_NETWORK_SANDBOX: Joi.boolean().default(true),
  
  // Email configuration
  EMAIL_ENABLED: Joi.boolean().default(false),
  EMAIL_HOST: Joi.string().when('EMAIL_ENABLED', {
    is: true,
    then: Joi.required(),
  }),
  EMAIL_PORT: Joi.number().default(587),
  EMAIL_SECURE: Joi.boolean().default(false),
  EMAIL_USER: Joi.string().when('EMAIL_ENABLED', {
    is: true,
    then: Joi.required(),
  }),
  EMAIL_PASSWORD: Joi.string().when('EMAIL_ENABLED', {
    is: true,
    then: Joi.required(),
  }),
  EMAIL_FROM: Joi.string().when('EMAIL_ENABLED', {
    is: true,
    then: Joi.required(),
  }),

  // SMS configuration
  SMS_ENABLED: Joi.boolean().default(false),
  TWILIO_ACCOUNT_SID: Joi.string().when('SMS_ENABLED', {
    is: true,
    then: Joi.required(),
  }),
  TWILIO_AUTH_TOKEN: Joi.string().when('SMS_ENABLED', {
    is: true,
    then: Joi.required(),
  }),
  TWILIO_PHONE_NUMBER: Joi.string().when('SMS_ENABLED', {
    is: true,
    then: Joi.required(),
  }),

  // Feature flags
  FEATURE_SMS: Joi.boolean().default(false),
  FEATURE_EMAIL: Joi.boolean().default(false),
  FEATURE_OTP: Joi.boolean().default(false),
  FEATURE_FRAUD: Joi.boolean().default(false),
  FEATURE_ANALYTICS: Joi.boolean().default(false),
});