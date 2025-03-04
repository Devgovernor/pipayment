import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { MonitoringService } from './monitoring.service';
import { SystemMetric } from './entities/system-metric.entity';
import { ErrorLog } from './entities/error-log.entity';
import { AuditLog } from './entities/audit-log.entity';

@ApiTags('Admin - Monitoring')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get system metrics' })
  @ApiResponse({ status: 200, description: 'Return system metrics' })
  async getMetrics(
    @Query('from') from: Date,
    @Query('to') to: Date,
  ): Promise<SystemMetric[]> {
    return this.monitoringService.getSystemMetrics(from, to);
  }

  @Get('errors')
  @ApiOperation({ summary: 'Get error logs' })
  @ApiResponse({ status: 200, description: 'Return error logs' })
  async getErrorLogs(
    @Query('from') from: Date,
    @Query('to') to: Date,
  ): Promise<ErrorLog[]> {
    return this.monitoringService.getSystemLogs(from, to);
  }

  @Get('audit')
  @ApiOperation({ summary: 'Get audit logs' })
  @ApiResponse({ status: 200, description: 'Return audit logs' })
  async getAuditLogs(
    @Query('from') from: Date,
    @Query('to') to: Date,
  ): Promise<AuditLog[]> {
    return this.monitoringService.getAuditLogs(from, to);
  }
}