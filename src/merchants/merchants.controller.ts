import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MerchantsService } from './merchants.service';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { Merchant } from '../database/entities/merchant.entity';

@ApiTags('Admin - Merchants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/merchants')
export class MerchantsController {
  constructor(private readonly merchantsService: MerchantsService) {}

  @Post()
  @ApiOperation({ summary: 'Create merchant' })
  @ApiResponse({ status: 201, description: 'Merchant created successfully' })
  create(@Body() createMerchantDto: CreateMerchantDto): Promise<Merchant> {
    return this.merchantsService.create(createMerchantDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all merchants' })
  @ApiResponse({ status: 200, description: 'Return all merchants' })
  findAll(): Promise<Merchant[]> {
    return this.merchantsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get merchant by id' })
  @ApiResponse({ status: 200, description: 'Return merchant by id' })
  findOne(@Param('id') id: string): Promise<Merchant> {
    return this.merchantsService.findOne(id);
  }
}