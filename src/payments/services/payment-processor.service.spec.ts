import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentProcessorService } from './payment-processor.service';
import { Payment } from '../../database/entities/payment.entity';
import { PiNetworkService } from './pi-network.service';
import { WebhooksService } from '../../webhooks/webhooks.service';
import { FraudPreventionService } from '../../fraud-prevention/fraud-prevention.service';
import { PaymentStatus } from '../enums/payment-status.enum';

describe('PaymentProcessorService', () => {
  let service: PaymentProcessorService;
  let paymentRepository: Repository<Payment>;
  let piNetworkService: PiNetworkService;
  let webhooksService: WebhooksService;
  let fraudPreventionService: FraudPreventionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentProcessorService,
        {
          provide: getRepositoryToken(Payment),
          useValue: {
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: PiNetworkService,
          useValue: {
            createPayment: jest.fn(),
          },
        },
        {
          provide: WebhooksService,
          useValue: {
            notifyPaymentUpdate: jest.fn(),
          },
        },
        {
          provide: FraudPreventionService,
          useValue: {
            evaluatePayment: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentProcessorService>(PaymentProcessorService);
    paymentRepository = module.get(getRepositoryToken(Payment));
    piNetworkService = module.get<PiNetworkService>(PiNetworkService);
    webhooksService = module.get<WebhooksService>(WebhooksService);
    fraudPreventionService = module.get<FraudPreventionService>(FraudPreventionService);
  });

  describe('processPayment', () => {
    it('should process payment successfully', async () => {
      const payment = new Payment();
      payment.amount = 100;
      payment.merchant = { id: 'test-merchant', businessName: 'Test Merchant' } as any;

      jest.spyOn(fraudPreventionService, 'evaluatePayment').mockResolvedValue({
        approved: true,
        score: 0.2,
        reasons: [],
      });

      jest.spyOn(piNetworkService, 'createPayment').mockResolvedValue({
        id: 'test-pi-payment',
      });

      const result = await service.processPayment(payment);

      expect(result.status).toBe(PaymentStatus.PROCESSING);
      expect(result.metadata.piPaymentId).toBe('test-pi-payment');
      expect(paymentRepository.save).toHaveBeenCalled();
      expect(webhooksService.notifyPaymentUpdate).toHaveBeenCalled();
    });

    it('should fail payment when risk score is too high', async () => {
      const payment = new Payment();
      
      jest.spyOn(fraudPreventionService, 'evaluatePayment').mockResolvedValue({
        approved: false,
        score: 0.8,
        reasons: ['High risk score detected'],
      });

      const result = await service.processPayment(payment);

      expect(result.status).toBe(PaymentStatus.FAILED);
      expect(result.metadata.failureReason).toBe('High risk score detected');
      expect(piNetworkService.createPayment).not.toHaveBeenCalled();
    });

    it('should handle Pi Network API errors', async () => {
      const payment = new Payment();
      payment.amount = 100;
      payment.merchant = { id: 'test-merchant', businessName: 'Test Merchant' } as any;

      jest.spyOn(fraudPreventionService, 'evaluatePayment').mockResolvedValue({
        approved: true,
        score: 0.2,
        reasons: [],
      });

      jest.spyOn(piNetworkService, 'createPayment').mockRejectedValue(new Error('API Error'));

      const result = await service.processPayment(payment);

      expect(result.status).toBe(PaymentStatus.FAILED);
      expect(result.metadata.failureReason).toBe('API Error');
    });
  });
});