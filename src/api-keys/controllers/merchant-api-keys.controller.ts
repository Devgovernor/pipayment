import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { ApiKeyAuthGuard } from '../../auth/guards/api-key-auth.guard';
import { MerchantFromApiKey } from '../../auth/decorators/merchant-from-api-key.decorator';
import { Merchant } from '../../database/entities/merchant.entity';
import { ApiKeysService } from '../api-keys.service';
import { CreateApiKeyDto } from '../dto/create-api-key.dto';
import { ApiKey } from '../../database/entities/api-key.entity';

@ApiTags('Merchant API v1 - API Keys')
@ApiSecurity('api-key')
@UseGuards(ApiKeyAuthGuard)
@Controller('api/merchant/v1/api-keys')
export class MerchantApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  @ApiOperation({ summary: 'List API keys' })
  @ApiResponse({ status: 200, description: 'Return list of API keys' })
  async findAll(@MerchantFromApiKey() merchant: Merchant): Promise<ApiKey[]> {
    return this.apiKeysService.findByMerchant(merchant.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new API key' })
  @ApiResponse({ status: 201, description: 'API key created successfully' })
  async create(
    @MerchantFromApiKey() merchant: Merchant,
    @Body() createApiKeyDto: CreateApiKeyDto,
  ): Promise<ApiKey> {
    return this.apiKeysService.createForMerchant(merchant.id, createApiKeyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete API key' })
  @ApiResponse({ status: 200, description: 'API key deleted successfully' })
  async delete(
    @MerchantFromApiKey() merchant: Merchant,
    @Param('id') id: string,
  ): Promise<void> {
    return this.apiKeysService.deactivate(id);
  }

  @Post(':id/rotate')
  @ApiOperation({ summary: 'Rotate API key' })
  @ApiResponse({ status: 200, description: 'API key rotated successfully' })
  async rotate(
    @MerchantFromApiKey() merchant: Merchant,
    @Param('id') id: string,
  ): Promise<ApiKey> {
    return this.apiKeysService.rotateKey(id);
  }
}