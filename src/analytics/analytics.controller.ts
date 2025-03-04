import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('Admin - Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('payment-stats')
  @ApiOperation({ summary: 'Get payment statistics' })
  @ApiResponse({ status: 200, description: 'Return payment statistics' })
  async getPaymentStats(
    @Query('merchantId') merchantId?: string,
    @Query('from') from?: Date,
    @Query('to') to?: Date,
  ) {
    return this.analyticsService.getPaymentStats(merchantId, from, to);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue by period' })
  @ApiResponse({ status: 200, description: 'Return revenue statistics' })
  async getRevenue(
    @Query('period') period: 'day' | 'week' | 'month',
    @Query('merchantId') merchantId?: string,
  ) {
    return this.analyticsService.getRevenueByPeriod(period, merchantId);
  }

  @Get('top-merchants')
  @ApiOperation({ summary: 'Get top merchants' })
  @ApiResponse({ status: 200, description: 'Return top merchants' })
  async getTopMerchants(@Query('limit') limit?: number) {
    return this.analyticsService.getTopMerchants(limit);
  }
}