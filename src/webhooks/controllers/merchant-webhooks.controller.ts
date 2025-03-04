import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { ApiKeyAuthGuard } from '../../auth/guards/api-key-auth.guard';
import { MerchantFromApiKey } from '../../auth/decorators/merchant-from-api-key.decorator';
import { Merchant } from '../../database/entities/merchant.entity';
import { WebhooksService } from '../webhooks.service';
import { CreateWebhookEndpointDto } from '../dto/create-webhook-endpoint.dto';
import { WebhookEndpoint } from '../entities/webhook-endpoint.entity';

@ApiTags('Merchant API v1 - Webhooks')
@ApiSecurity('api-key')
@UseGuards(ApiKeyAuthGuard)
@Controller('api/merchant/v1/webhooks')
export class MerchantWebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get('endpoints')
  @ApiOperation({ summary: 'List webhook endpoints' })
  @ApiResponse({ status: 200, description: 'Return list of webhook endpoints' })
  async findEndpoints(@MerchantFromApiKey() merchant: Merchant): Promise<WebhookEndpoint[]> {
    return this.webhooksService.findEndpointsByMerchant(merchant.id);
  }

  @Post('endpoints')
  @ApiOperation({ summary: 'Create webhook endpoint' })
  @ApiResponse({ status: 201, description: 'Webhook endpoint created successfully' })
  async createEndpoint(
    @MerchantFromApiKey() merchant: Merchant,
    @Body() createEndpointDto: CreateWebhookEndpointDto,
  ): Promise<WebhookEndpoint> {
    return this.webhooksService.createEndpoint(merchant, createEndpointDto);
  }

  @Delete('endpoints/:id')
  @ApiOperation({ summary: 'Delete webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook endpoint deleted successfully' })
  async deleteEndpoint(
    @MerchantFromApiKey() merchant: Merchant,
    @Param('id') id: string,
  ): Promise<void> {
    return this.webhooksService.deleteEndpoint(merchant.id, id);
  }

  @Get('deliveries')
  @ApiOperation({ summary: 'List webhook deliveries' })
  @ApiResponse({ status: 200, description: 'Return list of webhook deliveries' })
  async findDeliveries(@MerchantFromApiKey() merchant: Merchant) {
    return this.webhooksService.findDeliveriesByMerchant(merchant.id);
  }

  @Post('endpoints/:id/test')
  @ApiOperation({ summary: 'Test webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Test webhook sent successfully' })
  async testEndpoint(
    @MerchantFromApiKey() merchant: Merchant,
    @Param('id') id: string,
  ) {
    return this.webhooksService.sendTestWebhook(merchant.id, id);
  }
}