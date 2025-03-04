import { Controller, Post, Get, Body, Param, Delete, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { MarketplaceService } from '../services/marketplace.service';
import { AddSellerDto } from '../dto/add-seller.dto';
import { MarketplacePaymentDto } from '../dto/marketplace-payment.dto';
import { MarketplaceSeller } from '../entities/marketplace-seller.entity';
import { Payment } from '../../database/entities/payment.entity';
import { ApiKeyAuthGuard } from '../../auth/guards/api-key-auth.guard';
import { MerchantFromApiKey } from '../../auth/decorators/merchant-from-api-key.decorator';
import { Merchant } from '../../database/entities/merchant.entity';

@ApiTags('Merchant API v1 - Marketplace')
@ApiSecurity('api-key')
@UseGuards(ApiKeyAuthGuard)
@Controller('api/merchant/v1/marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Post('sellers')
  @ApiOperation({ summary: 'Add seller to marketplace' })
  @ApiResponse({ status: 201, description: 'Seller added successfully' })
  async addSeller(
    @Body() addSellerDto: AddSellerDto,
    @MerchantFromApiKey() merchant: Merchant,
  ): Promise<MarketplaceSeller> {
    return this.marketplaceService.addSeller(merchant, addSellerDto);
  }

  @Get('sellers')
  @ApiOperation({ summary: 'Get marketplace sellers' })
  @ApiResponse({ status: 200, description: 'Return marketplace sellers' })
  async getSellers(
    @MerchantFromApiKey() merchant: Merchant,
  ): Promise<MarketplaceSeller[]> {
    return this.marketplaceService.getSellers(merchant.id);
  }

  @Delete('sellers/:sellerId')
  @ApiOperation({ summary: 'Remove seller from marketplace' })
  @ApiResponse({ status: 200, description: 'Seller removed successfully' })
  async removeSeller(
    @Param('sellerId') sellerId: string,
    @MerchantFromApiKey() merchant: Merchant,
  ): Promise<void> {
    return this.marketplaceService.removeSeller(merchant.id, sellerId);
  }

  @Patch('sellers/:sellerId/commission')
  @ApiOperation({ summary: 'Update seller commission rate' })
  @ApiResponse({ status: 200, description: 'Commission rate updated successfully' })
  async updateCommissionRate(
    @Param('sellerId') sellerId: string,
    @Body('commissionRate') commissionRate: number,
    @MerchantFromApiKey() merchant: Merchant,
  ): Promise<MarketplaceSeller> {
    return this.marketplaceService.updateCommissionRate(
      merchant.id,
      sellerId,
      commissionRate,
    );
  }

  @Post('payments')
  @ApiOperation({ summary: 'Process marketplace payment' })
  @ApiResponse({ status: 201, description: 'Payment processed successfully' })
  async processPayment(
    @Body() paymentDto: MarketplacePaymentDto,
    @MerchantFromApiKey() merchant: Merchant,
  ): Promise<Payment> {
    return this.marketplaceService.processMarketplacePayment(merchant, paymentDto);
  }
}