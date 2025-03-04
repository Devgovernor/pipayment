import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { ApiKeyAuthGuard } from '../../auth/guards/api-key-auth.guard';
import { MerchantFromApiKey } from '../../auth/decorators/merchant-from-api-key.decorator';
import { Merchant } from '../../database/entities/merchant.entity';
import { NotificationPreferencesService } from '../services/notification-preferences.service';
import { UpdateNotificationPreferencesDto } from '../dto/update-notification-preferences.dto';

@ApiTags('Merchant API v1 - Notification Preferences')
@ApiSecurity('api-key')
@UseGuards(ApiKeyAuthGuard)
@Controller('api/merchant/v1/notifications/preferences')
export class NotificationPreferencesController {
  constructor(
    private readonly notificationPreferencesService: NotificationPreferencesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get notification preferences' })
  @ApiResponse({ status: 200, description: 'Return notification preferences' })
  async getPreferences(@MerchantFromApiKey() merchant: Merchant) {
    return this.notificationPreferencesService.getPreferences(merchant.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update notification preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated successfully' })
  async updatePreferences(
    @MerchantFromApiKey() merchant: Merchant,
    @Body() updatePreferencesDto: UpdateNotificationPreferencesDto,
  ) {
    return this.notificationPreferencesService.updatePreferences(
      merchant.id,
      updatePreferencesDto,
    );
  }
}