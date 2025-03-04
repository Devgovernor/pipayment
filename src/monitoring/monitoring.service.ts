import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { SystemMetric } from './entities/system-metric.entity';
import { ErrorLog } from './entities/error-log.entity';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  constructor(
    @InjectRepository(SystemMetric)
    private readonly systemMetricRepository: Repository<SystemMetric>,
    @InjectRepository(ErrorLog)
    private readonly errorLogRepository: Repository<ErrorLog>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async recordMetric(name: string, value: number, metadata?: Record<string, any>): Promise<SystemMetric> {
    try {
      const metric = this.systemMetricRepository.create({
        metricName: name,
        value,
        metadata,
      });
      return await this.systemMetricRepository.save(metric);
    } catch (error) {
      this.logger.error(`Failed to record metric ${name}: ${error.message}`);
      throw error;
    }
  }

  async logError(error: Error, userId?: string, metadata?: Record<string, any>): Promise<ErrorLog> {
    try {
      const errorLog = this.errorLogRepository.create({
        errorMessage: error.message,
        stackTrace: error.stack || '',
        userId,
        metadata,
      });
      return await this.errorLogRepository.save(errorLog);
    } catch (error) {
      this.logger.error(`Failed to log error: ${error.message}`);
      throw error;
    }
  }

  async logAudit(
    action: string,
    userId: string | null,
    resourceId: string,
    changes: Record<string, any>,
    ipAddress: string | null,
    userAgent: string,
  ): Promise<AuditLog> {
    try {
      const auditLog = this.auditLogRepository.create({
        action,
        userId,
        resourceId,
        changes,
        ipAddress,
        userAgent,
        timestamp: new Date(),
      });
      return await this.auditLogRepository.save(auditLog);
    } catch (error) {
      this.logger.error(`Failed to log audit: ${error.message}`);
      throw error;
    }
  }

  async getSystemMetrics(from?: Date, to?: Date): Promise<SystemMetric[]> {
    try {
      const query = this.systemMetricRepository.createQueryBuilder('metric');
      
      if (from && to) {
        query.where('metric.timestamp BETWEEN :from AND :to', { from, to });
      }

      return await query
        .orderBy('metric.timestamp', 'DESC')
        .getMany();
    } catch (error) {
      this.logger.error(`Failed to get system metrics: ${error.message}`);
      throw error;
    }
  }

  async getSystemLogs(from?: Date, to?: Date): Promise<ErrorLog[]> {
    try {
      const query = this.errorLogRepository.createQueryBuilder('error');
      
      if (from && to) {
        query.where('error.timestamp BETWEEN :from AND :to', { from, to });
      }

      return await query
        .orderBy('error.timestamp', 'DESC')
        .getMany();
    } catch (error) {
      this.logger.error(`Failed to get system logs: ${error.message}`);
      throw error;
    }
  }

  async getAuditLogs(from?: Date, to?: Date): Promise<AuditLog[]> {
    try {
      const query = this.auditLogRepository.createQueryBuilder('audit');
      
      if (from && to) {
        query.where('audit.timestamp BETWEEN :from AND :to', { from, to });
      }

      return await query
        .orderBy('audit.timestamp', 'DESC')
        .getMany();
    } catch (error) {
      this.logger.error(`Failed to get audit logs: ${error.message}`);
      throw error;
    }
  }
}