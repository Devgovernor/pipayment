export class CurrencyUtils {
  static formatAmount(amount: number, currency: string = 'PI'): string {
    return `${amount.toFixed(2)} ${currency}`;
  }

  static convertToCents(amount: number): number {
    return Math.round(amount * 100);
  }

  static convertFromCents(cents: number): number {
    return cents / 100;
  }

  static validateAmount(amount: number): boolean {
    return amount > 0 && Number.isFinite(amount);
  }

  static calculateFee(amount: number, feePercentage: number): number {
    return (amount * feePercentage) / 100;
  }
}