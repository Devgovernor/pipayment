import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RefundsService } from './refunds.service';
import { CreateRefundDto } from './dto/create-refund.dto';
import { Refund } from './entities/refund.entity';

@ApiTags('Admin - Refunds')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/refunds')
export class RefundsController {
  constructor(private readonly refundsService: RefundsService) {}

  @Post()
  @ApiOperation({ summary: 'Create refund' })
  @ApiResponse({ status: 201, description: 'Refund created successfully' })
  async create(@Body() createRefundDto: CreateRefundDto): Promise<Refund> {
    return this.refundsService.create(createRefundDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all refunds' })
  @ApiResponse({ status: 200, description: 'Return all refunds' })
  async findAll(): Promise<Refund[]> {
    return this.refundsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get refund by id' })
  @ApiResponse({ status: 200, description: 'Return refund by id' })
  @ApiResponse({ status: 404, description: 'Refund not found' })
  async findOne(@Param('id') id: string): Promise<Refund> {
    return this.refundsService.findOne(id);
  }
}