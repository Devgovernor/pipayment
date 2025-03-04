import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PiNetworkService } from './pi-network.service';

describe('PiNetworkService', () => {
  let service: PiNetworkService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PiNetworkService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'app.piNetwork.apiKey':
                  return 'test-api-key';
                case 'app.piNetwork.apiSecret':
                  return 'test-api-secret';
                case 'app.piNetwork.sandbox':
                  return true;
                default:
                  return undefined;
              }
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PiNetworkService>(PiNetworkService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPayment', () => {
    it('should create a payment successfully', async () => {
      const mockResponse = { id: 'test-payment-id', status: 'pending' };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await service.createPayment(100, 'Test payment', {});
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: 'Bad Request',
      });

      await expect(service.createPayment(100, 'Test payment', {}))
        .rejects
        .toThrow('Pi Network API error: Bad Request');
    });
  });
});