import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from '../../../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../../../src/common/interceptors/transform.interceptor';

describe('MerchantsController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();

    // Get admin token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'admin123',
      });
    adminToken = loginResponse.body.data.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /admin/merchants', () => {
    it('should require authentication', () => {
      return request(app.getHttpServer())
        .post('/admin/merchants')
        .send({
          businessName: 'Test Merchant',
          email: 'test@merchant.com',
        })
        .expect(401);
    });

    it('should validate merchant creation payload', () => {
      return request(app.getHttpServer())
        .post('/admin/merchants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          businessName: '',
          email: 'invalid-email',
        })
        .expect(400)
        .expect((res: request.Response) => {
          expect(res.body.errors).toBeDefined();
          expect(res.body.errors.length).toBeGreaterThan(0);
        });
    });

    it('should create merchant', () => {
      return request(app.getHttpServer())
        .post('/admin/merchants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          businessName: 'Test Merchant',
          email: 'test@merchant.com',
          phone: '+1234567890',
        })
        .expect(201)
        .expect((res: request.Response) => {
          expect(res.body.data.id).toBeDefined();
          expect(res.body.data.businessName).toBe('Test Merchant');
          expect(res.body.data.email).toBe('test@merchant.com');
        });
    });
  });
});