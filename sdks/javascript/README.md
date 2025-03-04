# Pi Payment Gateway JavaScript SDK

This SDK provides a simple way to integrate with the Pi Payment Gateway in JavaScript/TypeScript applications.

## Installation

```bash
npm install pi-payment-gateway-sdk
```

## Usage

```typescript
import { PiPaymentGateway } from 'pi-payment-gateway-sdk';

// Initialize the client
const gateway = new PiPaymentGateway({
  apiKey: 'your-api-key',
});

// Create a payment
const payment = await gateway.createPayment({
  amount: 100.50,
  currency: 'PI',
  description: 'Product purchase',
});

// Get payment status
const status = await gateway.getPayment(payment.id);

// Create a refund
const refund = await gateway.createRefund({
  paymentId: payment.id,
  amount: 100.50,
  reason: 'Customer request',
});
```

## Error Handling

The SDK throws errors for API errors and network issues. Always wrap API calls in try/catch blocks:

```typescript
try {
  const payment = await gateway.createPayment({
    amount: 100.50,
    currency: 'PI',
  });
} catch (error) {
  console.error('Payment failed:', error.message);
}
```

## Security

The SDK automatically:
- Signs all requests with your API key
- Uses HTTPS for all API calls
- Includes timestamps to prevent replay attacks