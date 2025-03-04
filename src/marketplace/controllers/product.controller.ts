import { Controller, Post, Get, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { ProductService } from '../services/product.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { MarketplaceProduct } from '../entities/marketplace-product.entity';
import { ApiKeyAuthGuard } from '../../auth/guards/api-key-auth.guard';
import { MerchantFromApiKey } from '../../auth/decorators/merchant-from-api-key.decorator';
import { Merchant } from '../../database/entities/merchant.entity';

@ApiTags('Merchant API v1 - Marketplace Products')
@ApiSecurity('api-key')
@UseGuards(ApiKeyAuthGuard)
@Controller('api/merchant/v1/marketplace/products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post(':sellerId')
  @ApiOperation({ summary: 'Create product for seller' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  async create(
    @Param('sellerId') sellerId: string,
    @Body() createProductDto: CreateProductDto,
  ): Promise<MarketplaceProduct> {
    return this.productService.create(sellerId, createProductDto);
  }

  @Get('seller/:sellerId')
  @ApiOperation({ summary: 'Get seller products' })
  @ApiResponse({ status: 200, description: 'Return seller products' })
  async findBySeller(
    @Param('sellerId') sellerId: string,
  ): Promise<MarketplaceProduct[]> {
    return this.productService.findBySeller(sellerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by id' })
  @ApiResponse({ status: 200, description: 'Return product by id' })
  async findOne(@Param('id') id: string): Promise<MarketplaceProduct> {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<MarketplaceProduct> {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate product' })
  @ApiResponse({ status: 200, description: 'Product deactivated successfully' })
  async deactivate(@Param('id') id: string): Promise<void> {
    return this.productService.deactivate(id);
  }
}