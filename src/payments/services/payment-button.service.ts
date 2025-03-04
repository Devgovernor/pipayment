import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import { CreatePaymentButtonDto } from '../dto/create-payment-button.dto';

@Injectable()
export class PaymentButtonService {
  constructor(private readonly configService: ConfigService) {}

  async generateButton(merchantId: string, dto: CreatePaymentButtonDto): Promise<string> {
    const paymentUrl = this.generatePaymentUrl(merchantId, dto);
    const qrCode = await QRCode.toDataURL(paymentUrl);
    
    return this.generateHtmlButton(dto, paymentUrl, qrCode);
  }

  private generatePaymentUrl(merchantId: string, dto: CreatePaymentButtonDto): string {
    const baseUrl = this.configService.get<string>('app.baseUrl');
    const params = new URLSearchParams({
      amount: dto.amount.toString(),
      currency: dto.currency,
      merchant: merchantId,
      description: dto.description || '',
      success_url: dto.successUrl || '',
      cancel_url: dto.cancelUrl || '',
      ...dto.metadata,
    });

    return `${baseUrl}/pay?${params.toString()}`;
  }

  private generateHtmlButton(
    dto: CreatePaymentButtonDto,
    paymentUrl: string,
    qrCode: string,
  ): string {
    return `
      <div class="pi-payment-button" style="font-family: Arial, sans-serif;">
        <button 
          onclick="window.location.href='${paymentUrl}'"
          style="
            background-color: #7B1FA2;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            transition: background-color 0.3s;
          "
          onmouseover="this.style.backgroundColor='#9C27B0'"
          onmouseout="this.style.backgroundColor='#7B1FA2'"
        >
          ${dto.buttonText}
        </button>
        <div style="margin-top: 12px;">
          <img src="${qrCode}" alt="Payment QR Code" style="max-width: 200px;"/>
        </div>
      </div>
    `;
  }
}