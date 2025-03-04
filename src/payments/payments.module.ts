import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsMerchantApiV1Controller } from './merchant-api/v1/payments-merchant-api-v1.controller';
import { SubscriptionController } from './controllers/subscription.controller';
import { PaymentLinkController } from './controllers/payment-link.controller';
import { PaymentButtonController } from './controllers/payment-button.controller';
import { VirtualTerminalController } from './controllers/virtual-terminal.controller';
import { BatchProcessingController } from './controllers/batch-processing.controller';
import { PaymentsService } from './payments.service';
import { SubscriptionService } from './services/subscription.service';
import { PaymentLinkService } from './services/payment-link.service';
import { PaymentButtonService } from './services/payment-button.service';
import { PaymentSplitService } from './services/payment-split.service';
import { QrPaymentService } from './services/qr-payment.service';
import { VirtualTerminalService } from './services/virtual-terminal.service';
import { BatchProcessingService } from './services/batch-processing.service';
import { Payment } from '../database/entities/payment.entity';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionPayment } from './entities/subscription-payment.entity';
import { PaymentLink } from './entities/payment-link.entity';
import { PaymentSplit } from './entities/payment-split.entity';
import { BatchPayment } from './entities/batch-payment.entity';
import { TransactionsModule } from '../transactions/transactions.module';
import { MerchantsModule } from '../merchants/merchants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      Subscription,
      SubscriptionPayment,
      PaymentLink,
      PaymentSplit,
      BatchPayment,
    ]),
    TransactionsModule,
    MerchantsModule,
  ],
  controllers: [
    PaymentsController,
    PaymentsMerchantApiV1Controller,
    SubscriptionController,
    PaymentLinkController,
    PaymentButtonController,
    VirtualTerminalController,
    BatchProcessingController,
  ],
  providers: [
    PaymentsService,
    SubscriptionService,
    PaymentLinkService,
    PaymentButtonService,
    PaymentSplitService,
    QrPaymentService,
    VirtualTerminalService,
    BatchProcessingService,
  ],
  exports: [
    PaymentsService,
    SubscriptionService,
    PaymentLinkService,
    PaymentSplitService,
    QrPaymentService,
    VirtualTerminalService,
    BatchProcessingService,
  ],
})
export class PaymentsModule {}