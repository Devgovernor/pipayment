import { Controller, Get, Put, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../auth/guards/super-admin.guard';
import { ConfigManagementService } from '../services/config-management.service';
import { UpdateConfigDto } from '../dto/update-config.dto';
import { User } from '../../common/decorators/user.decorator';

@ApiTags('Admin - System Configuration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('admin/config')
export class ConfigManagementController {
  constructor(private readonly configManagementService: ConfigManagementService) {}

  @Get()
  @ApiOperation({ summary: 'Get all system configurations' })
  @ApiResponse({ status: 200, description: 'Return all configurations' })
  async getAllConfigs() {
    return this.configManagementService.getAllConfigs();
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get configuration by key' })
  @ApiResponse({ status: 200, description: 'Return configuration value' })
  async getConfig(@Param('key') key: string) {
    return this.configManagementService.getConfig(key);
  }

  @Put(':key')
  @ApiOperation({ summary: 'Update configuration' })
  @ApiResponse({ status: 200, description: 'Configuration updated successfully' })
  async updateConfig(
    @Param('key') key: string,
    @Body() updateConfigDto: UpdateConfigDto,
    @User() user: any,
  ) {
    await this.configManagementService.setConfig(key, updateConfigDto.value, user.id);
    return { message: 'Configuration updated successfully' };
  }

  @Post(':key/reset')
  @ApiOperation({ summary: 'Reset configuration to default' })
  @ApiResponse({ status: 200, description: 'Configuration reset successfully' })
  async resetConfig(@Param('key') key: string, @User() user: any) {
    await this.configManagementService.resetConfig(key, user.id);
    return { message: 'Configuration reset successfully' };
  }

  @Get('validate/all')
  @ApiOperation({ summary: 'Validate all configurations' })
  @ApiResponse({ status: 200, description: 'Return validation results' })
  async validateConfigs() {
    return this.configManagementService.validateAllConfigs();
  }
}