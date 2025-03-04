import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SettlementsService } from './settlements.service';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { Settlement } from './entities/settlement.entity';

@ApiTags('Admin - Settlements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/settlements')
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @Post()
  @ApiOperation({ summary: 'Create settlement' })
  @ApiResponse({ status: 201, description: 'Settlement created successfully' })
  async create(@Body() createSettlementDto: CreateSettlementDto): Promise<Settlement> {
    return this.settlementsService.create(createSettlementDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all settlements' })
  @ApiResponse({ status: 200, description: 'Return all settlements' })
  async findAll(): Promise<Settlement[]> {
    return this.settlementsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get settlement by id' })
  @ApiResponse({ status: 200, description: 'Return settlement by id' })
  @ApiResponse({ status: 404, description: 'Settlement not found' })
  async findOne(@Param('id') id: string): Promise<Settlement> {
    return this.settlementsService.findOne(id);
  }
}