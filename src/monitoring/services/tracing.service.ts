import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';

@Injectable()
export class TracingService implements OnModuleInit {
  private readonly logger = new Logger(TracingService.name);

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    try {
      const provider = new NodeTracerProvider({
        resource: new Resource({
          [SemanticResourceAttributes.SERVICE_NAME]: 'pi-payment-gateway',
          [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: this.configService.get('app.environment'),
        }),
      });

      const jaegerEndpoint = this.configService.get('app.jaeger.endpoint');
      if (jaegerEndpoint) {
        provider.addSpanProcessor(
          new SimpleSpanProcessor(
            new JaegerExporter({
              endpoint: jaegerEndpoint,
            }),
          ),
        );
      }

      provider.register();

      registerInstrumentations({
        instrumentations: [
          new HttpInstrumentation(),
          new ExpressInstrumentation(),
          new NestInstrumentation(),
        ],
      });

      this.logger.log('Tracing initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize tracing:', error);
    }
  }
}