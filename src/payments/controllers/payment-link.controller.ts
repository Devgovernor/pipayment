import { Controller, Post, Get, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { PaymentLinkService } from '../services/payment-link.service';
import { CreatePaymentLinkDto } from '../dto/create-payment-link.dto';
import { PaymentLink } from '../entities/payment-link.entity';
import { ApiKeyAuthGuard } from '../../auth/guards/api-key-auth.guard';
import { MerchantFromApiKey } from '../../auth/decorators/merchant-from-api-key.decorator';
import { Merchant } from '../../database/entities/merchant.entity';

@ApiTags('Merchant API v1 - Payment Links')
@ApiSecurity('api-key')
@UseGuards(ApiKeyAuthGuard)
@Controller('api/merchant/v1/payment-links')
export class PaymentLinkController {
  constructor(private readonly paymentLinkService: PaymentLinkService) {}

  @Post()
  @ApiOperation({ summary: 'Create payment link' })
  @ApiResponse({ status: 201, description: 'Payment link created successfully' })
  async create(
    @Body() createPaymentLinkDto: CreatePaymentLinkDto,
    @MerchantFromApiKey() merchant: Merchant,
  ): Promise<PaymentLink> {
    return this.paymentLinkService.create(merchant, createPaymentLinkDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get merchant payment links' })
  @ApiResponse({ status: 200, description: 'Return merchant payment links' })
  async findMerchantLinks(
    @MerchantFromApiKey() merchant: Merchant,
  ): Promise<PaymentLink[]> {
    return this.paymentLinkService.findByMerchant(merchant.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment link by id' })
  @ApiResponse({ status: 200, description: 'Return payment link by id' })
  async findOne(@Param('id') id: string): Promise<PaymentLink> {
    return this.paymentLinkService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate payment link' })
  @ApiResponse({ status: 200, description: 'Payment link deactivated successfully' })
  async deactivate(@Param('id') id: string): Promise<void> {
    return this.paymentLinkService.deactivate(id);
  }
}