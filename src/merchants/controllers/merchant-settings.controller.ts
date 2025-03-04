import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { ApiKeyAuthGuard } from '../../auth/guards/api-key-auth.guard';
import { MerchantFromApiKey } from '../../auth/decorators/merchant-from-api-key.decorator';
import { Merchant } from '../../database/entities/merchant.entity';
import { MerchantSettingsService } from '../services/merchant-settings.service';
import { UpdateSettingsDto } from '../dto/update-settings.dto';

@ApiTags('Merchant API v1 - Settings')
@ApiSecurity('api-key')
@UseGuards(ApiKeyAuthGuard)
@Controller('api/merchant/v1/settings')
export class MerchantSettingsController {
  constructor(private readonly merchantSettingsService: MerchantSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get merchant settings' })
  @ApiResponse({ status: 200, description: 'Return merchant settings' })
  async getSettings(@MerchantFromApiKey() merchant: Merchant) {
    return this.merchantSettingsService.getSettings(merchant.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update merchant settings' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  async updateSettings(
    @MerchantFromApiKey() merchant: Merchant,
    @Body() updateSettingsDto: UpdateSettingsDto,
  ) {
    return this.merchantSettingsService.updateSettings(merchant.id, updateSettingsDto);
  }
}