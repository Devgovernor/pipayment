import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import { Payment } from '../../database/entities/payment.entity';
import { SecurityUtils } from '../../common/utils/security.utils';

@Injectable()
export class QrPaymentService {
  constructor(private readonly configService: ConfigService) {}

  async generatePaymentQR(payment: Payment): Promise<string> {
    const paymentData = {
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      merchant: payment.merchant.id,
      timestamp: new Date().toISOString(),
      nonce: SecurityUtils.generateSecureToken(16),
    };

    const webhookSecret = this.configService.get<string>('app.piNetwork.webhookSecret');
    if (!webhookSecret) {
      throw new Error('Webhook secret not configured');
    }

    const signature = SecurityUtils.generateHmac(JSON.stringify(paymentData), webhookSecret);
    const qrData = {
      ...paymentData,
      signature,
      baseUrl: this.configService.get<string>('app.baseUrl'),
    };

    return QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
    });
  }

  async verifyPaymentQR(qrData: string): Promise<boolean> {
    try {
      const data = JSON.parse(qrData);
      const { signature, ...paymentData } = data;
      const webhookSecret = this.configService.get<string>('app.piNetwork.webhookSecret');
      if (!webhookSecret) {
        throw new Error('Webhook secret not configured');
      }
      const expectedSignature = SecurityUtils.generateHmac(JSON.stringify(paymentData), webhookSecret);
      return signature === expectedSignature;
    } catch (error) {
      return false;
    }
  }
}