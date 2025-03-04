import { Controller, Post, Body, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DisputesService } from './disputes.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { UpdateDisputeStatusDto } from './dto/update-dispute-status.dto';
import { Dispute } from './entities/dispute.entity';

@ApiTags('Admin - Disputes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/disputes')
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post()
  @ApiOperation({ summary: 'Create dispute' })
  @ApiResponse({ status: 201, description: 'Dispute created successfully' })
  async create(@Body() createDisputeDto: CreateDisputeDto): Promise<Dispute> {
    return this.disputesService.create(createDisputeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all disputes' })
  @ApiResponse({ status: 200, description: 'Return all disputes' })
  async findAll(): Promise<Dispute[]> {
    return this.disputesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dispute by id' })
  @ApiResponse({ status: 200, description: 'Return dispute by id' })
  async findOne(@Param('id') id: string): Promise<Dispute> {
    return this.disputesService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update dispute status' })
  @ApiResponse({ status: 200, description: 'Dispute status updated successfully' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateDisputeStatusDto: UpdateDisputeStatusDto,
  ): Promise<Dispute> {
    return this.disputesService.updateStatus(id, updateDisputeStatusDto);
  }
}