import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { PaymentButtonService } from '../services/payment-button.service';
import { CreatePaymentButtonDto } from '../dto/create-payment-button.dto';
import { ApiKeyAuthGuard } from '../../auth/guards/api-key-auth.guard';
import { MerchantFromApiKey } from '../../auth/decorators/merchant-from-api-key.decorator';
import { Merchant } from '../../database/entities/merchant.entity';

@ApiTags('Merchant API v1 - Payment Buttons')
@ApiSecurity('api-key')
@UseGuards(ApiKeyAuthGuard)
@Controller('api/merchant/v1/payment-buttons')
export class PaymentButtonController {
  constructor(private readonly paymentButtonService: PaymentButtonService) {}

  @Post()
  @ApiOperation({ summary: 'Generate payment button HTML' })
  @ApiResponse({ status: 201, description: 'Payment button HTML generated successfully' })
  async createButton(
    @Body() createPaymentButtonDto: CreatePaymentButtonDto,
    @MerchantFromApiKey() merchant: Merchant,
  ): Promise<{ html: string }> {
    const html = await this.paymentButtonService.generateButton(
      merchant.id,
      createPaymentButtonDto,
    );
    return { html };
  }
}