import axios, { AxiosInstance } from 'axios';
import { createHmac } from 'crypto';

export interface PaymentGatewayConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export interface CreatePaymentParams {
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface CreateRefundParams {
  paymentId: string;
  amount: number;
  reason: string;
  metadata?: Record<string, any>;
}

export class PiPaymentGateway {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(config: PaymentGatewayConfig) {
    this.apiKey = config.apiKey;
    this.client = axios.create({
      baseURL: config.baseUrl || 'https://api.pipaymentgateway.com',
      timeout: config.timeout || 10000,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for signing
    this.client.interceptors.request.use(request => {
      const timestamp = new Date().toISOString();
      const payload = JSON.stringify({
        method: request.method,
        url: request.url,
        body: request.data,
        timestamp,
      });

      request.headers['X-Timestamp'] = timestamp;
      request.headers['X-Signature'] = this.signRequest(payload);

      return request;
    });
  }

  private signRequest(payload: string): string {
    return createHmac('sha256', this.apiKey)
      .update(payload)
      .digest('hex');
  }

  async createPayment(params: CreatePaymentParams) {
    try {
      const response = await this.client.post('/api/merchant/v1/payments', params);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getPayment(paymentId: string) {
    try {
      const response = await this.client.get(`/api/merchant/v1/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createRefund(params: CreateRefundParams) {
    try {
      const response = await this.client.post('/api/merchant/v1/refunds', params);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any) {
    if (error.response) {
      const { status, data } = error.response;
      return new Error(`API Error ${status}: ${data.message}`);
    }
    return error;
  }
}