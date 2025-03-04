import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  @Get('health/db')
  @ApiOperation({ summary: 'Test database connection' })
  @ApiResponse({ status: 200, description: 'Database connection successful' })
  @ApiResponse({ status: 500, description: 'Database connection failed' })
  async testDbConnection() {
    try {
      const result = await this.dataSource.query('SELECT NOW()');
      return {
        status: 'ok',
        timestamp: result[0].now,
        connected: true,
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        connected: false,
      };
    }
  }
}