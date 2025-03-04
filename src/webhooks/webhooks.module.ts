import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhooksController } from './webhooks.controller';
import { MerchantWebhooksController } from './controllers/merchant-webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { WebhookDeliveryService } from './services/webhook-delivery.service';
import { WebhookDelivery } from './entities/webhook-delivery.entity';
import { WebhookEndpoint } from './entities/webhook-endpoint.entity';
import { PaymentsModule } from '../payments/payments.module';
import { RefundsModule } from '../refunds/refunds.module';
import { DisputesModule } from '../disputes/disputes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WebhookDelivery, WebhookEndpoint]),
    PaymentsModule,
    RefundsModule,
    forwardRef(() => DisputesModule),
  ],
  controllers: [WebhooksController, MerchantWebhooksController],
  providers: [WebhooksService, WebhookDeliveryService],
  exports: [WebhooksService],
})
export class WebhooksModule {}