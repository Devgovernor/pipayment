import { Controller, Post, Get, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { CheckoutService } from '../services/checkout.service';
import { CreateCheckoutTemplateDto } from '../dto/create-checkout-template.dto';
import { CheckoutTemplate } from '../entities/checkout-template.entity';
import { ApiKeyAuthGuard } from '../../auth/guards/api-key-auth.guard';
import { MerchantFromApiKey } from '../../auth/decorators/merchant-from-api-key.decorator';
import { Merchant } from '../../database/entities/merchant.entity';

@ApiTags('Merchant API v1 - Checkout')
@ApiSecurity('api-key')
@UseGuards(ApiKeyAuthGuard)
@Controller('api/merchant/v1/checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('templates')
  @ApiOperation({ summary: 'Create checkout template' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  async createTemplate(
    @Body() createTemplateDto: CreateCheckoutTemplateDto,
    @MerchantFromApiKey() merchant: Merchant,
  ): Promise<CheckoutTemplate> {
    return this.checkoutService.createTemplate(merchant, createTemplateDto);
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get merchant checkout templates' })
  @ApiResponse({ status: 200, description: 'Return merchant checkout templates' })
  async findMerchantTemplates(
    @MerchantFromApiKey() merchant: Merchant,
  ): Promise<CheckoutTemplate[]> {
    return this.checkoutService.findByMerchant(merchant.id);
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get checkout template by id' })
  @ApiResponse({ status: 200, description: 'Return checkout template by id' })
  async findOne(@Param('id') id: string): Promise<CheckoutTemplate> {
    return this.checkoutService.findOne(id);
  }

  @Patch('templates/:id')
  @ApiOperation({ summary: 'Update checkout template' })
  @ApiResponse({ status: 200, description: 'Template updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateTemplateDto: Partial<CreateCheckoutTemplateDto>,
  ): Promise<CheckoutTemplate> {
    return this.checkoutService.update(id, updateTemplateDto);
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'Deactivate checkout template' })
  @ApiResponse({ status: 200, description: 'Template deactivated successfully' })
  async deactivate(@Param('id') id: string): Promise<void> {
    return this.checkoutService.deactivate(id);
  }

  @Get('render/:templateId')
  @ApiOperation({ summary: 'Render checkout page' })
  @ApiResponse({ status: 200, description: 'Return rendered checkout HTML' })
  async renderCheckout(
    @Param('templateId') templateId: string,
    @Body() paymentData: any,
  ): Promise<string> {
    return this.checkoutService.renderCheckout(templateId, paymentData);
  }
}