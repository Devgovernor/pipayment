# SDK Integration Examples

## JavaScript/TypeScript

```typescript
import { PiPaymentGateway } from 'pi-payment-gateway-sdk';

// Initialize the client
const gateway = new PiPaymentGateway({
  apiKey: 'your-api-key',
});

// Create a payment
const createPayment = async () => {
  try {
    const payment = await gateway.createPayment({
      amount: 100.50,
      currency: 'PI',
      description: 'Product purchase',
      metadata: {
        orderId: 'ORD123',
        customerEmail: 'customer@example.com',
      },
    });
    console.log('Payment created:', payment.id);
  } catch (error) {
    console.error('Payment failed:', error.message);
  }
};

// Get payment status
const checkPaymentStatus = async (paymentId: string) => {
  try {
    const status = await gateway.getPayment(paymentId);
    console.log('Payment status:', status.status);
  } catch (error) {
    console.error('Status check failed:', error.message);
  }
};
```

## Python

```python
from pi_payment_gateway import PiPaymentGateway

# Initialize the client
gateway = PiPaymentGateway(api_key='your-api-key')

# Create a payment
def create_payment():
    try:
        payment = gateway.create_payment(
            amount=100.50,
            currency='PI',
            description='Product purchase',
            metadata={
                'orderId': 'ORD123',
                'customerEmail': 'customer@example.com',
            }
        )
        print(f'Payment created: {payment["id"]}')
    except ValueError as e:
        print(f'Payment failed: {str(e)}')
    except Exception as e:
        print(f'Unexpected error: {str(e)}')

# Get payment status
def check_payment_status(payment_id):
    try:
        status = gateway.get_payment(payment_id)
        print(f'Payment status: {status["status"]}')
    except ValueError as e:
        print(f'Status check failed: {str(e)}')
    except Exception as e:
        print(f'Unexpected error: {str(e)}')
```

## Security Best Practices

1. API Key Management
```typescript
// Don't hardcode API keys
const apiKey = process.env.PI_PAYMENT_GATEWAY_API_KEY;
const gateway = new PiPaymentGateway({ apiKey });
```

2. Error Handling
```typescript
try {
  const payment = await gateway.createPayment({
    amount: 100.50,
    currency: 'PI',
  });
} catch (error) {
  if (error.message.includes('API Error 401')) {
    // Handle authentication errors
  } else if (error.message.includes('API Error 429')) {
    // Handle rate limiting
  } else {
    // Handle other errors
  }
}
```

3. Webhook Handling
```typescript
// Verify webhook signatures
const isValidWebhook = (payload: string, signature: string) => {
  const expectedSignature = createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex');
  return signature === expectedSignature;
};
```

## Testing

1. JavaScript/TypeScript
```typescript
import { PiPaymentGateway } from 'pi-payment-gateway-sdk';

describe('Payment Integration', () => {
  const gateway = new PiPaymentGateway({
    apiKey: 'test-api-key',
    baseUrl: 'https://api.sandbox.pipaymentgateway.com',
  });

  it('should create a payment', async () => {
    const payment = await gateway.createPayment({
      amount: 100.50,
      currency: 'PI',
    });
    expect(payment.id).toBeDefined();
    expect(payment.status).toBe('pending');
  });
});
```

2. Python
```python
import unittest
from pi_payment_gateway import PiPaymentGateway

class TestPaymentIntegration(unittest.TestCase):
    def setUp(self):
        self.gateway = PiPaymentGateway(
            api_key='test-api-key',
            base_url='https://api.sandbox.pipaymentgateway.com'
        )

    def test_create_payment(self):
        payment = self.gateway.create_payment(
            amount=100.50,
            currency='PI'
        )
        self.assertIn('id', payment)
        self.assertEqual(payment['status'], 'pending')
```