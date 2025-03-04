import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckoutTemplate } from './entities/checkout-template.entity';
import { CheckoutService } from './services/checkout.service';
import { CheckoutController } from './controllers/checkout.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([CheckoutTemplate]),
  ],
  controllers: [CheckoutController],
  providers: [CheckoutService],
  exports: [CheckoutService],
})
export class CheckoutModule {}