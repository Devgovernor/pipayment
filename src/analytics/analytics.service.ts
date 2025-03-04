import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async getPaymentStats(merchantId?: string, from?: Date, to?: Date) {
    const query = this.dataSource
      .createQueryBuilder()
      .select([
        'COUNT(*) as total_payments',
        'SUM(amount) as total_amount',
        'AVG(amount) as average_amount',
        'status',
      ])
      .from('payments', 'p')
      .groupBy('status');

    if (merchantId) {
      query.where('merchant_id = :merchantId', { merchantId });
    }

    if (from && to) {
      query.andWhere('created_at BETWEEN :from AND :to', { from, to });
    }

    return query.getRawMany();
  }

  async getRevenueByPeriod(period: 'day' | 'week' | 'month', merchantId?: string) {
    const query = this.dataSource
      .createQueryBuilder()
      .select([
        'DATE_TRUNC(:period, created_at) as period',
        'SUM(amount) as revenue',
        'COUNT(*) as transaction_count',
      ])
      .from('payments', 'p')
      .where('status = :status', { status: 'completed' })
      .groupBy('period')
      .orderBy('period', 'DESC')
      .setParameter('period', period);

    if (merchantId) {
      query.andWhere('merchant_id = :merchantId', { merchantId });
    }

    return query.getRawMany();
  }

  async getTopMerchants(limit: number = 10) {
    return this.dataSource
      .createQueryBuilder()
      .select([
        'm.id',
        'm.business_name',
        'COUNT(p.id) as payment_count',
        'SUM(p.amount) as total_amount',
      ])
      .from('merchants', 'm')
      .leftJoin('payments', 'p', 'p.merchant_id = m.id')
      .where('p.status = :status', { status: 'completed' })
      .groupBy('m.id')
      .orderBy('total_amount', 'DESC')
      .limit(limit)
      .getRawMany();
  }
}