import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from '../../../../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../../../../src/common/interceptors/transform.interceptor';

describe('PaymentsMerchantApiV1Controller (e2e)', () => {
  let app: INestApplication;
  const validApiKey = 'test-api-key';

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/merchant/v1/payments', () => {
    it('should require API key', () => {
      return request(app.getHttpServer())
        .post('/api/merchant/v1/payments')
        .send({
          amount: 100,
          currency: 'PI',
        })
        .expect(401);
    });

    it('should validate payment payload', () => {
      return request(app.getHttpServer())
        .post('/api/merchant/v1/payments')
        .set('Authorization', `Bearer ${validApiKey}`)
        .send({
          amount: -100,
          currency: '',
        })
        .expect(400)
        .expect((res: request.Response) => {
          expect(res.body.errors).toBeDefined();
          expect(res.body.errors.length).toBeGreaterThan(0);
        });
    });
  });
});