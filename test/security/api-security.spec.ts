import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { createHmac } from 'crypto';

describe('API Security', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Request Signing', () => {
    it('should reject requests without signature', () => {
      return request(app.getHttpServer())
        .post('/api/merchant/v1/payments')
        .send({
          amount: 100,
          currency: 'PI',
        })
        .expect(401);
    });

    it('should reject requests with invalid signature', () => {
      const timestamp = new Date().toISOString();
      
      return request(app.getHttpServer())
        .post('/api/merchant/v1/payments')
        .set('X-Signature', 'invalid')
        .set('X-Timestamp', timestamp)
        .send({
          amount: 100,
          currency: 'PI',
        })
        .expect(401);
    });

    it('should accept requests with valid signature', () => {
      const timestamp = new Date().toISOString();
      const payload = JSON.stringify({
        method: 'POST',
        url: '/api/merchant/v1/payments',
        body: { amount: 100, currency: 'PI' },
        timestamp,
      });

      const signature = createHmac('sha256', 'test-secret')
        .update(payload)
        .digest('hex');

      return request(app.getHttpServer())
        .post('/api/merchant/v1/payments')
        .set('X-Signature', signature)
        .set('X-Timestamp', timestamp)
        .send({
          amount: 100,
          currency: 'PI',
        })
        .expect(201);
    });
  });

  describe('Rate Limiting', () => {
    it('should limit requests per IP', async () => {
      const requests = Array(11).fill(null).map(() => 
        request(app.getHttpServer())
          .get('/api/merchant/v1/payments')
          .set('Authorization', 'Bearer test-key')
      );

      const responses = await Promise.all(requests);
      expect(responses[10].status).toBe(429);
    });
  });

  describe('API Key Rotation', () => {
    it('should warn about expiring API key', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/merchant/v1/payments')
        .set('Authorization', 'Bearer old-test-key');

      expect(response.headers['x-api-key-rotation']).toBeDefined();
      expect(response.headers['x-new-api-key']).toBeDefined();
    });
  });
});