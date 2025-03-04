import { Controller, Post, Get, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { InvoicingService } from '../services/invoicing.service';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';
import { Invoice } from '../entities/invoice.entity';
import { InvoiceStatus } from '../enums/invoice-status.enum';
import { ApiKeyAuthGuard } from '../../auth/guards/api-key-auth.guard';
import { MerchantFromApiKey } from '../../auth/decorators/merchant-from-api-key.decorator';
import { Merchant } from '../../database/entities/merchant.entity';

@ApiTags('Merchant API v1 - Invoicing')
@ApiSecurity('api-key')
@UseGuards(ApiKeyAuthGuard)
@Controller('api/merchant/v1/invoices')
export class InvoicingController {
  constructor(private readonly invoicingService: InvoicingService) {}

  @Post()
  @ApiOperation({ summary: 'Create invoice' })
  @ApiResponse({ status: 201, description: 'Invoice created successfully' })
  async create(
    @Body() createInvoiceDto: CreateInvoiceDto,
    @MerchantFromApiKey() merchant: Merchant,
  ): Promise<Invoice> {
    return this.invoicingService.create(merchant, createInvoiceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get merchant invoices' })
  @ApiResponse({ status: 200, description: 'Return merchant invoices' })
  async findMerchantInvoices(
    @MerchantFromApiKey() merchant: Merchant,
  ): Promise<Invoice[]> {
    return this.invoicingService.findByMerchant(merchant.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by id' })
  @ApiResponse({ status: 200, description: 'Return invoice by id' })
  async findOne(@Param('id') id: string): Promise<Invoice> {
    return this.invoicingService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update invoice status' })
  @ApiResponse({ status: 200, description: 'Invoice status updated successfully' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: InvoiceStatus,
  ): Promise<Invoice> {
    return this.invoicingService.updateStatus(id, status);
  }
}