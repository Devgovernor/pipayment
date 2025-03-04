import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { AuthService } from '../auth.service';
import { ImpersonateDto } from '../dto/impersonate.dto';

@ApiTags('Admin - Auth')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('impersonate')
  @ApiOperation({ summary: 'Impersonate user' })
  @ApiResponse({ status: 201, description: 'Impersonation successful' })
  async impersonate(@Body() impersonateDto: ImpersonateDto) {
    return this.authService.impersonate(impersonateDto.userId);
  }
}