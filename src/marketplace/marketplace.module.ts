import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketplaceSeller } from './entities/marketplace-seller.entity';
import { MarketplaceProduct } from './entities/marketplace-product.entity';
import { MarketplaceOrder } from './entities/marketplace-order.entity';
import { MarketplaceOrderItem } from './entities/marketplace-order-item.entity';
import { MarketplaceService } from './services/marketplace.service';
import { ProductService } from './services/product.service';
import { OrderService } from './services/order.service';
import { DigitalProductService } from './services/digital-product.service';
import { MarketplaceController } from './controllers/marketplace.controller';
import { ProductController } from './controllers/product.controller';
import { OrderController } from './controllers/order.controller';
import { DigitalProductController } from './controllers/digital-product.controller';
import { PaymentsModule } from '../payments/payments.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MarketplaceSeller,
      MarketplaceProduct,
      MarketplaceOrder,
      MarketplaceOrderItem,
    ]),
    PaymentsModule,
    NotificationsModule,
  ],
  controllers: [
    MarketplaceController,
    ProductController,
    OrderController,
    DigitalProductController,
  ],
  providers: [
    MarketplaceService,
    ProductService,
    OrderService,
    DigitalProductService,
  ],
  exports: [
    MarketplaceService,
    ProductService,
    OrderService,
    DigitalProductService,
  ],
})
export class MarketplaceModule {}