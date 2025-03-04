import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { ApiKeyAuthGuard } from '../../auth/guards/api-key-auth.guard';
import { MerchantFromApiKey } from '../../auth/decorators/merchant-from-api-key.decorator';
import { Merchant } from '../../database/entities/merchant.entity';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UpdatePasswordDto } from '../dto/update-password.dto';
import { MerchantProfileService } from '../services/merchant-profile.service';

@ApiTags('Merchant API v1 - Profile')
@ApiSecurity('api-key')
@UseGuards(ApiKeyAuthGuard)
@Controller('api/merchant/v1/profile')
export class MerchantProfileController {
  constructor(private readonly merchantProfileService: MerchantProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get merchant profile' })
  @ApiResponse({ status: 200, description: 'Return merchant profile' })
  async getProfile(@MerchantFromApiKey() merchant: Merchant) {
    return this.merchantProfileService.getProfile(merchant.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update merchant profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @MerchantFromApiKey() merchant: Merchant,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.merchantProfileService.updateProfile(merchant.id, updateProfileDto);
  }

  @Patch('password')
  @ApiOperation({ summary: 'Update merchant password' })
  @ApiResponse({ status: 200, description: 'Password updated successfully' })
  async updatePassword(
    @MerchantFromApiKey() merchant: Merchant,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    return this.merchantProfileService.updatePassword(merchant.id, updatePasswordDto);
  }
}