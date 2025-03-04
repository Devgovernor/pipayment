import { Controller, Get, Post, Param, Query, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { Response } from 'express';
import { DigitalProductService } from '../services/digital-product.service';
import { ProductService } from '../services/product.service';
import { OrderService } from '../services/order.service';
import { ApiKeyAuthGuard } from '../../auth/guards/api-key-auth.guard';
import { MerchantFromApiKey } from '../../auth/decorators/merchant-from-api-key.decorator';
import { Merchant } from '../../database/entities/merchant.entity';

@ApiTags('Merchant API v1 - Digital Products')
@ApiSecurity('api-key')
@UseGuards(ApiKeyAuthGuard)
@Controller('api/merchant/v1/marketplace/digital-products')
export class DigitalProductController {
  constructor(
    private readonly digitalProductService: DigitalProductService,
    private readonly productService: ProductService,
    private readonly orderService: OrderService,
  ) {}

  @Get(':productId/preview')
  @ApiOperation({ summary: 'Get digital product preview' })
  @ApiResponse({ status: 200, description: 'Return product preview' })
  async getPreview(@Param('productId') productId: string) {
    const product = await this.productService.findOne(productId);
    return this.digitalProductService.generatePreviewContent(product);
  }

  @Get(':orderId/license')
  @ApiOperation({ summary: 'Get digital product license key' })
  @ApiResponse({ status: 200, description: 'Return license key' })
  async getLicense(@Param('orderId') orderId: string) {
    const order = await this.orderService.findOne(orderId);
    const product = order.items[0].product;
    const licenseKey = await this.digitalProductService.generateLicenseKey(product, order);
    
    return { licenseKey };
  }

  @Get(':orderId/download')
  @ApiOperation({ summary: 'Get digital product download link' })
  @ApiResponse({ status: 200, description: 'Return download access token' })
  async getDownloadLink(
    @Param('orderId') orderId: string,
    @Query('downloadId') downloadId: string,
  ) {
    const order = await this.orderService.findOne(orderId);
    const product = order.items[0].product;
    
    const canDownload = await this.digitalProductService.trackDownload(
      product,
      order,
      downloadId,
    );

    if (!canDownload) {
      return { error: 'Download limit exceeded' };
    }

    const accessToken = await this.digitalProductService.generateAccessToken(
      product,
      order,
      downloadId,
    );

    return { accessToken };
  }

  @Get(':orderId/content')
  @ApiOperation({ summary: 'Access digital product content' })
  @ApiResponse({ status: 200, description: 'Return digital content' })
  async getContent(
    @Param('orderId') orderId: string,
    @Query('token') token: string,
    @Res() response: Response,
  ) {
    const tokenData = await this.digitalProductService.verifyAccessToken(token);
    if (!tokenData) {
      return response.status(401).json({ error: 'Invalid or expired token' });
    }

    const order = await this.orderService.findOne(orderId);
    const product = order.items[0].product;

    // Redirect to actual content with watermark if applicable
    if (product.digitalContent?.downloadUrl) {
      return response.redirect(product.digitalContent.downloadUrl);
    }

    return response.json({
      accessInstructions: product.digitalContent?.accessInstructions,
    });
  }
}