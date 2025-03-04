import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from '../../../../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../../../../src/common/interceptors/transform.interceptor';

describe('MerchantsMerchantApiV1Controller (e2e)', () => {
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

  describe('GET /api/merchant/v1/profile', () => {
    it('should require API key', () => {
      return request(app.getHttpServer())
        .get('/api/merchant/v1/profile')
        .expect(401);
    });

    it('should return merchant profile', () => {
      return request(app.getHttpServer())
        .get('/api/merchant/v1/profile')
        .set('Authorization', `Bearer ${validApiKey}`)
        .expect(200)
        .expect((res: request.Response) => {
          expect(res.body.data).toBeDefined();
          expect(res.body.data.businessName).toBeDefined();
          expect(res.body.data.email).toBeDefined();
        });
    });
  });

  describe('PATCH /api/merchant/v1/profile', () => {
    it('should validate update payload', () => {
      return request(app.getHttpServer())
        .patch('/api/merchant/v1/profile')
        .set('Authorization', `Bearer ${validApiKey}`)
        .send({
          phone: 'invalid-phone',
        })
        .expect(400)
        .expect((res: request.Response) => {
          expect(res.body.errors).toBeDefined();
          expect(res.body.errors.length).toBeGreaterThan(0);
        });
    });
  });
});