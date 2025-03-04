import { Controller, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { ApiKey } from '../database/entities/api-key.entity';

@ApiTags('Admin - API Keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post(':merchantId')
  @ApiOperation({ summary: 'Create API key for merchant' })
  @ApiResponse({ status: 201, description: 'API key created successfully' })
  async create(
    @Param('merchantId') merchantId: string,
    @Body() createApiKeyDto: CreateApiKeyDto,
  ): Promise<ApiKey> {
    return this.apiKeysService.createForMerchant(merchantId, createApiKeyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate API key' })
  @ApiResponse({ status: 200, description: 'API key deactivated successfully' })
  async deactivate(@Param('id') id: string): Promise<void> {
    return this.apiKeysService.deactivate(id);
  }
}