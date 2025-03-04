import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { PaymentsService } from '../../payments.service';
import { ApiKeyAuthGuard } from '../../../auth/guards/api-key-auth.guard';
import { CreatePaymentDto } from '../../dto/create-payment.dto';
import { Payment } from '../../../database/entities/payment.entity';
import { MerchantFromApiKey } from '../../../auth/decorators/merchant-from-api-key.decorator';
import { Merchant } from '../../../database/entities/merchant.entity';

@ApiTags('Merchant API v1 - Payments')
@ApiSecurity('api-key')
@UseGuards(ApiKeyAuthGuard)
@Controller('api/merchant/v1/payments')
export class PaymentsMerchantApiV1Controller {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create payment' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  async create(
    @Body() createPaymentDto: CreatePaymentDto,
    @MerchantFromApiKey() merchant: Merchant,
  ): Promise<Payment> {
    return this.paymentsService.create({
      ...createPaymentDto,
      merchant,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get merchant payments' })
  @ApiResponse({ status: 200, description: 'Return merchant payments' })
  async findMerchantPayments(@MerchantFromApiKey() merchant: Merchant): Promise<Payment[]> {
    return this.paymentsService.findByMerchant(merchant.id);
  }
}