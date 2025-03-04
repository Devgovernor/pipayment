import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';

@Injectable()
export class PiNetworkService {
  private readonly logger = new Logger(PiNetworkService.name);
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('app.piNetwork.apiKey');
    const apiSecret = this.configService.get<string>('app.piNetwork.apiSecret');
    
    if (!apiKey || !apiSecret) {
      throw new Error('Pi Network API credentials not configured');
    }

    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseUrl = this.configService.get<boolean>('app.piNetwork.sandbox')
      ? 'https://api.sandbox.pi.network/v1'
      : 'https://api.pi.network/v1';
  }

  private generateSignature(payload: string): string {
    return createHmac('sha256', this.apiSecret)
      .update(payload)
      .digest('hex');
  }

  private async makeRequest(method: string, endpoint: string, data?: any) {
    const timestamp = Date.now().toString();
    const payload = JSON.stringify(data || {});
    const signature = this.generateSignature(payload + timestamp);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Pi-API-Key': this.apiKey,
          'X-Pi-Timestamp': timestamp,
          'X-Pi-Signature': signature,
        },
        body: method !== 'GET' ? payload : undefined,
      });

      if (!response.ok) {
        throw new Error(`Pi Network API error: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      this.logger.error(`Pi Network API request failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async createPayment(amount: number, memo: string, metadata: Record<string, any>) {
    return this.makeRequest('POST', '/payments', {
      amount,
      memo,
      metadata,
    });
  }

  async getPayment(paymentId: string) {
    return this.makeRequest('GET', `/payments/${paymentId}`);
  }

  async approvePayment(paymentId: string) {
    return this.makeRequest('POST', `/payments/${paymentId}/approve`);
  }

  async completePayment(paymentId: string, txid: string) {
    return this.makeRequest('POST', `/payments/${paymentId}/complete`, { txid });
  }
}