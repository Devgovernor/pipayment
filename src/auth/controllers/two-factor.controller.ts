import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { ApiKeyAuthGuard } from '../guards/api-key-auth.guard';
import { MerchantFromApiKey } from '../decorators/merchant-from-api-key.decorator';
import { Merchant } from '../../database/entities/merchant.entity';
import { TwoFactorService } from '../services/two-factor.service';
import { VerifyOtpDto } from '../dto/verify-otp.dto';

@ApiTags('Merchant API v1 - Two-Factor Authentication')
@ApiSecurity('api-key')
@UseGuards(ApiKeyAuthGuard)
@Controller('api/merchant/v1/2fa')
export class TwoFactorController {
  constructor(private readonly twoFactorService: TwoFactorService) {}

  @Post('enable')
  @ApiOperation({ summary: 'Enable 2FA' })
  @ApiResponse({ status: 200, description: 'Returns QR code and secret' })
  async enable(@MerchantFromApiKey() merchant: Merchant) {
    return this.twoFactorService.enable(merchant.id);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify and activate 2FA' })
  @ApiResponse({ status: 200, description: '2FA activated successfully' })
  async verify(
    @MerchantFromApiKey() merchant: Merchant,
    @Body() verifyOtpDto: VerifyOtpDto,
  ) {
    return this.twoFactorService.verify(merchant.id, verifyOtpDto.token);
  }

  @Post('disable')
  @ApiOperation({ summary: 'Disable 2FA' })
  @ApiResponse({ status: 200, description: '2FA disabled successfully' })
  async disable(
    @MerchantFromApiKey() merchant: Merchant,
    @Body() verifyOtpDto: VerifyOtpDto,
  ) {
    return this.twoFactorService.disable(merchant.id, verifyOtpDto.token);
  }
}