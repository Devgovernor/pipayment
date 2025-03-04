import { Controller, Post, Get, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { SubscriptionService } from '../services/subscription.service';
import { CreateSubscriptionDto } from '../dto/create-subscription.dto';
import { Subscription } from '../entities/subscription.entity';
import { ApiKeyAuthGuard } from '../../auth/guards/api-key-auth.guard';
import { MerchantFromApiKey } from '../../auth/decorators/merchant-from-api-key.decorator';
import { Merchant } from '../../database/entities/merchant.entity';

@ApiTags('Merchant API v1 - Subscriptions')
@ApiSecurity('api-key')
@UseGuards(ApiKeyAuthGuard)
@Controller('api/merchant/v1/subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  @ApiOperation({ summary: 'Create subscription plan' })
  @ApiResponse({ status: 201, description: 'Subscription plan created successfully' })
  async create(
    @Body() createSubscriptionDto: CreateSubscriptionDto,
    @MerchantFromApiKey() merchant: Merchant,
  ): Promise<Subscription> {
    return this.subscriptionService.create(merchant, createSubscriptionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get merchant subscription plans' })
  @ApiResponse({ status: 200, description: 'Return merchant subscription plans' })
  async findMerchantSubscriptions(
    @MerchantFromApiKey() merchant: Merchant,
  ): Promise<Subscription[]> {
    return this.subscriptionService.findByMerchant(merchant.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription plan by id' })
  @ApiResponse({ status: 200, description: 'Return subscription plan by id' })
  async findOne(@Param('id') id: string): Promise<Subscription> {
    return this.subscriptionService.findOne(id);
  }
}