import { Controller, Post, Get, Body, Param, Patch, Delete, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { SuperAdminGuard } from '../guards/super-admin.guard';
import { AuthService } from '../auth.service';
import { CreateAdminDto } from '../dto/create-admin.dto';
import { User } from '../../database/entities/user.entity';
import { SystemConfigService } from '../../config/system-config.service';
import { MonitoringService } from '../../monitoring/monitoring.service';
import { NotificationService } from '../../notifications/services/notification.service';
import { User as UserDecorator } from '../../common/decorators/user.decorator';

@ApiTags('Super Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('super-admin')
export class SuperAdminController {
  constructor(
    private readonly authService: AuthService,
    private readonly systemConfigService: SystemConfigService,
    private readonly monitoringService: MonitoringService,
    private readonly notificationService: NotificationService,
  ) {}

  @Post('admins')
  @ApiOperation({ summary: 'Create new admin user' })
  @ApiResponse({ status: 201, description: 'Admin created successfully' })
  async createAdmin(@Body() createAdminDto: CreateAdminDto): Promise<User> {
    return this.authService.createAdmin(createAdminDto);
  }

  @Get('admins')
  @ApiOperation({ summary: 'Get all admin users' })
  @ApiResponse({ status: 200, description: 'Return all admin users' })
  async getAdmins() {
    return this.authService.findAllAdmins();
  }

  @Delete('admins/:id')
  @ApiOperation({ summary: 'Delete admin user' })
  @ApiResponse({ status: 200, description: 'Admin deleted successfully' })
  async deleteAdmin(@Param('id', ParseUUIDPipe) id: string) {
    return this.authService.deleteAdmin(id);
  }

  @Patch('merchants/:id/verify')
  @ApiOperation({ summary: 'Verify merchant' })
  @ApiResponse({ status: 200, description: 'Merchant verified successfully' })
  async verifyMerchant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('verified') verified: boolean,
  ) {
    return this.authService.updateMerchantVerification(id, verified);
  }

  @Patch('merchants/:id/suspend')
  @ApiOperation({ summary: 'Suspend merchant' })
  @ApiResponse({ status: 200, description: 'Merchant suspended successfully' })
  async suspendMerchant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('suspended') suspended: boolean,
  ) {
    return this.authService.updateMerchantSuspension(id, suspended);
  }

  @Patch('merchants/:id/balance')
  @ApiOperation({ summary: 'Adjust merchant balance' })
  @ApiResponse({ status: 200, description: 'Merchant balance adjusted successfully' })
  async adjustMerchantBalance(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('amount') amount: number,
  ): Promise<void> {
    return this.authService.adjustMerchantBalance(id, amount);
  }

  @Get('system/metrics')
  @ApiOperation({ summary: 'Get system metrics' })
  @ApiResponse({ status: 200, description: 'Return system metrics' })
  async getSystemMetrics() {
    return this.monitoringService.getSystemMetrics();
  }

  @Get('system/logs')
  @ApiOperation({ summary: 'Get system logs' })
  @ApiResponse({ status: 200, description: 'Return system logs' })
  async getSystemLogs() {
    return this.monitoringService.getSystemLogs();
  }

  @Post('system/maintenance')
  @ApiOperation({ summary: 'Enable/disable maintenance mode' })
  @ApiResponse({ status: 200, description: 'Maintenance mode updated' })
  async setMaintenanceMode(@Body('enabled') enabled: boolean) {
    return this.systemConfigService.setMaintenanceMode(enabled);
  }

  @Post('system/broadcast')
  @ApiOperation({ summary: 'Broadcast system notification' })
  @ApiResponse({ status: 200, description: 'Notification broadcasted' })
  async broadcastNotification(
    @Body('title') title: string,
    @Body('message') message: string,
    @Body('severity') severity: 'info' | 'warning' | 'critical',
  ) {
    return this.notificationService.broadcastSystemNotification(title, message, severity);
  }

  @Get('system/config')
  @ApiOperation({ summary: 'Get system configuration' })
  @ApiResponse({ status: 200, description: 'Return system configuration' })
  async getSystemConfig() {
    return this.systemConfigService.getConfig();
  }

  @Patch('system/config')
  @ApiOperation({ summary: 'Update system configuration' })
  @ApiResponse({ status: 200, description: 'System configuration updated' })
  async updateSystemConfig(@Body() config: Record<string, any>) {
    return this.systemConfigService.updateConfig(config);
  }
}