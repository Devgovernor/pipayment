import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import CC from 'currency-converter-lt';

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);
  private readonly converter: CC;

  constructor(private readonly configService: ConfigService) {
    this.converter = new CC();
  }

  async convert(amount: number, from: string, to: string): Promise<number> {
    try {
      const result = await this.converter.from(from).to(to).amount(amount).convert();
      return Number(result.toFixed(2));
    } catch (error) {
      this.logger.error(`Currency conversion failed: ${error.message}`);
      throw error;
    }
  }

  async getExchangeRate(from: string, to: string): Promise<number> {
    try {
      const rate = await this.converter.from(from).to(to).amount(1).convert();
      return Number(rate.toFixed(6));
    } catch (error) {
      this.logger.error(`Failed to get exchange rate: ${error.message}`);
      throw error;
    }
  }
}