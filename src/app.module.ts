import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { AppController } from './app.controller';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { PaymentsModule } from './payments/payments.module';
import { MerchantsModule } from './merchants/merchants.module';
import { TransactionsModule } from './transactions/transactions.module';
import { RefundsModule } from './refunds/refunds.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { SettlementsModule } from './settlements/settlements.module';
import { DisputesModule } from './disputes/disputes.module';
import { KycModule } from './kyc/kyc.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { QueueModule } from './queue/queue.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { FraudPreventionModule } from './fraud-prevention/fraud-prevention.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CustomersModule } from './customers/customers.module';
import { InvoicingModule } from './invoicing/invoicing.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { CheckoutModule } from './checkout/checkout.module';
import { ConfigModule as AppConfigModule } from './config/config.module';
import { BackupModule } from './backup/backup.module';
import { I18nModule } from './i18n/i18n.module';
import { CacheModule } from './cache/cache.module';
import { configuration } from './config/configuration';
import { validationSchema } from './config/validation';
import { SecurityMiddleware } from './common/middleware/security.middleware';
import { CompressionMiddleware } from './common/middleware/compression.middleware';
import { RateLimitMiddleware } from './common/middleware/rate-limit.middleware';
import { RateLimitPerRouteMiddleware } from './common/middleware/rate-limit-per-route.middleware';
import { CacheMiddleware } from './common/middleware/cache.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('app.database.host'),
        port: configService.get('app.database.port'),
        username: configService.get('app.database.username'),
        password: configService.get('app.database.password'),
        database: configService.get('app.database.database'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('app.environment') !== 'production',
        logging: configService.get('app.environment') !== 'production',
        ssl: {
          ca: join(process.cwd(), 'ca-certificate.crt'),
          rejectUnauthorized: false
        }
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('app.redis.host'),
          port: configService.get('app.redis.port'),
        },
      }),
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get('app.email.host'),
          port: configService.get('app.email.port'),
          secure: configService.get('app.email.secure'),
          auth: {
            user: configService.get('app.email.user'),
            pass: configService.get('app.email.password'),
          },
        },
        defaults: {
          from: configService.get('app.email.from'),
        },
        template: {
          dir: join(__dirname, 'templates/email'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
    ScheduleModule.forRoot(),
    CacheModule,
    HealthModule,
    AuthModule,
    PaymentsModule,
    MerchantsModule,
    TransactionsModule,
    RefundsModule,
    WebhooksModule,
    SettlementsModule,
    DisputesModule,
    KycModule,
    ApiKeysModule,
    QueueModule,
    SchedulerModule,
    MonitoringModule,
    AnalyticsModule,
    FraudPreventionModule,
    NotificationsModule,
    CustomersModule,
    InvoicingModule,
    MarketplaceModule,
    CheckoutModule,
    AppConfigModule,
    BackupModule,
    I18nModule,
  ],
  controllers: [AppController],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SecurityMiddleware, CompressionMiddleware)
      .forRoutes('*')
      .apply(RateLimitMiddleware)
      .forRoutes('*')
      .apply(RateLimitPerRouteMiddleware)
      .forRoutes(
        { path: '/api/merchant/v1/payments', method: RequestMethod.ALL },
        { path: '/api/merchant/v1/customers', method: RequestMethod.ALL },
        { path: '/api/merchant/v1/invoices', method: RequestMethod.ALL }
      )
      .apply(CacheMiddleware)
      .exclude(
        { path: '/api/merchant/v1/payments', method: RequestMethod.POST },
        { path: '/api/merchant/v1/webhooks', method: RequestMethod.ALL }
      )
      .forRoutes('*');
  }
}