import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PaymentStatus } from '../../src/payments/enums/payment-status.enum';

describe('Payment Workflow (Integration)', () => {
  let app: INestApplication;
  let apiKey: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get API key for testing
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password',
      });

    apiKey = response.body.apiKey;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should process payment workflow successfully', async () => {
    // 1. Create payment
    const paymentResponse = await request(app.getHttpServer())
      .post('/api/merchant/v1/payments')
      .set('Authorization', `Bearer ${apiKey}`)
      .send({
        amount: 100,
        currency: 'PI',
        description: 'Test payment',
      });

    expect(paymentResponse.status).toBe(201);
    expect(paymentResponse.body.data.status).toBe(PaymentStatus.PENDING);

    const paymentId = paymentResponse.body.data.id;

    // 2. Check payment status
    const statusResponse = await request(app.getHttpServer())
      .get(`/api/merchant/v1/payments/${paymentId}`)
      .set('Authorization', `Bearer ${apiKey}`);

    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body.data.id).toBe(paymentId);

    // 3. Process refund
    const refundResponse = await request(app.getHttpServer())
      .post('/api/merchant/v1/refunds')
      .set('Authorization', `Bearer ${apiKey}`)
      .send({
        paymentId,
        amount: 100,
        reason: 'Test refund',
      });

    expect(refundResponse.status).toBe(201);
    expect(refundResponse.body.data.status).toBe('pending');

    // 4. Verify webhooks received
    const webhooksResponse = await request(app.getHttpServer())
      .get('/api/merchant/v1/webhooks/deliveries')
      .set('Authorization', `Bearer ${apiKey}`);

    expect(webhooksResponse.status).toBe(200);
    expect(webhooksResponse.body.data).toHaveLength(2); // Payment and refund webhooks
  });
});