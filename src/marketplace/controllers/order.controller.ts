import { Controller, Post, Get, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { OrderService } from '../services/order.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { MarketplaceOrder } from '../entities/marketplace-order.entity';
import { OrderStatus } from '../enums/order-status.enum';
import { ApiKeyAuthGuard } from '../../auth/guards/api-key-auth.guard';
import { MerchantFromApiKey } from '../../auth/decorators/merchant-from-api-key.decorator';
import { Merchant } from '../../database/entities/merchant.entity';

@ApiTags('Merchant API v1 - Marketplace Orders')
@ApiSecurity('api-key')
@UseGuards(ApiKeyAuthGuard)
@Controller('api/merchant/v1/marketplace/orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: 'Create marketplace order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @MerchantFromApiKey() merchant: Merchant,
  ): Promise<MarketplaceOrder> {
    return this.orderService.create({
      ...createOrderDto,
      merchant,
    });
  }

  @Get('seller/:sellerId')
  @ApiOperation({ summary: 'Get seller orders' })
  @ApiResponse({ status: 200, description: 'Return seller orders' })
  async findBySeller(
    @Param('sellerId') sellerId: string,
  ): Promise<MarketplaceOrder[]> {
    return this.orderService.findBySeller(sellerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by id' })
  @ApiResponse({ status: 200, description: 'Return order by id' })
  async findOne(@Param('id') id: string): Promise<MarketplaceOrder> {
    return this.orderService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({ status: 200, description: 'Order status updated successfully' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
  ): Promise<MarketplaceOrder> {
    return this.orderService.updateStatus(id, status);
  }
}