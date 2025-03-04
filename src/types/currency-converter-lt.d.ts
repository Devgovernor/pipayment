declare module 'currency-converter-lt' {
  export default class CurrencyConverter {
    from(currency: string): this;
    to(currency: string): this;
    amount(value: number): this;
    convert(): Promise<number>;
  }
}