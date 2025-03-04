import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { I18nInterceptor } from './common/interceptors/i18n.interceptor';
import { I18nService } from './common/services/i18n.service';
import { ErrorTrackingService } from './monitoring/services/error-tracking.service';
import { PerformanceService } from './monitoring/services/performance.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global middleware
  app.use(helmet());
  app.use(compression());
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
    credentials: true,
  });

  // Global pipes and filters
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new LoggingInterceptor(),
    new I18nInterceptor(app.get(I18nService)),
  );

  // Initialize error tracking and performance monitoring
  const errorTracking = app.get(ErrorTrackingService);
  const performance = app.get(PerformanceService);

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Pi Payment Gateway API')
    .setDescription('The Pi Payment Gateway API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  performance.recordMetric('app.startup.time', Date.now());
}

bootstrap().catch(error => {
  console.error('Application failed to start:', error);
  process.exit(1);
});