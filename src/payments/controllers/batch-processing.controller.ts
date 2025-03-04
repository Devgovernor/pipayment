import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { BatchProcessingService } from '../services/batch-processing.service';
import { BatchPaymentDto } from '../dto/batch-payment.dto';
import { BatchPayment } from '../entities/batch-payment.entity';
import { ApiKeyAuthGuard } from '../../auth/guards/api-key-auth.guard';
import { MerchantFromApiKey } from '../../auth/decorators/merchant-from-api-key.decorator';
import { Merchant } from '../../database/entities/merchant.entity';

@ApiTags('Merchant API v1 - Batch Processing')
@ApiSecurity('api-key')
@UseGuards(ApiKeyAuthGuard)
@Controller('api/merchant/v1/batch-payments')
export class BatchProcessingController {
  constructor(private readonly batchProcessingService: BatchProcessingService) {}

  @Post()
  @ApiOperation({ summary: 'Process batch payment' })
  @ApiResponse({ status: 201, description: 'Batch payment initiated successfully' })
  async processBatch(
    @Body() batchDto: BatchPaymentDto,
    @MerchantFromApiKey() merchant: Merchant,
  ): Promise<BatchPayment> {
    return this.batchProcessingService.processBatch(merchant, batchDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get batch payment status' })
  @ApiResponse({ status: 200, description: 'Return batch payment status' })
  async getBatchStatus(@Param('id') id: string): Promise<BatchPayment> {
    return this.batchProcessingService.getBatchStatus(id);
  }
}