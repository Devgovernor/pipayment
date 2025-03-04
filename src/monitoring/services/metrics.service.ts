import { Injectable, OnModuleInit } from '@nestjs/common';
import { Registry, Counter, Gauge, Histogram } from 'prom-client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry: Registry;
  private readonly paymentCounter: Counter;
  private readonly paymentLatency: Histogram;
  private readonly activeConnections: Gauge;

  constructor(private readonly configService: ConfigService) {
    this.registry = new Registry();

    // Payment metrics
    this.paymentCounter = new Counter({
      name: 'payment_total',
      help: 'Total number of payments processed',
      labelNames: ['status'],
    });

    this.paymentLatency = new Histogram({
      name: 'payment_processing_duration_seconds',
      help: 'Payment processing duration in seconds',
      buckets: [0.1, 0.5, 1, 2, 5],
    });

    this.activeConnections = new Gauge({
      name: 'active_connections',
      help: 'Number of active connections',
    });

    // Register metrics
    this.registry.registerMetric(this.paymentCounter);
    this.registry.registerMetric(this.paymentLatency);
    this.registry.registerMetric(this.activeConnections);
  }

  async onModuleInit() {
    // Start collecting default metrics
    this.registry.setDefaultLabels({
      app: 'pi-payment-gateway',
      env: this.configService.get('app.environment'),
    });
  }

  incrementPaymentCounter(status: string) {
    this.paymentCounter.inc({ status });
  }

  recordPaymentLatency(durationMs: number) {
    this.paymentLatency.observe(durationMs / 1000);
  }

  setActiveConnections(count: number) {
    this.activeConnections.set(count);
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}