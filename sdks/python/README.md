# Pi Payment Gateway Python SDK

This SDK provides a simple way to integrate with the Pi Payment Gateway in Python applications.

## Installation

```bash
pip install pi-payment-gateway
```

## Usage

```python
from pi_payment_gateway import PiPaymentGateway

# Initialize the client
gateway = PiPaymentGateway(api_key='your-api-key')

# Create a payment
payment = gateway.create_payment(
    amount=100.50,
    currency='PI',
    description='Product purchase'
)

# Get payment status
status = gateway.get_payment(payment['id'])

# Create a refund
refund = gateway.create_refund(
    payment_id=payment['id'],
    amount=100.50,
    reason='Customer request'
)
```

## Error Handling

The SDK raises exceptions for API errors and network issues. Always use try/except blocks:

```python
try:
    payment = gateway.create_payment(
        amount=100.50,
        currency='PI'
    )
except ValueError as e:
    print(f'Payment failed: {str(e)}')
except Exception as e:
    print(f'Unexpected error: {str(e)}')
```

## Security

The SDK automatically:
- Signs all requests with your API key
- Uses HTTPS for all API calls
- Includes timestamps to prevent replay attacks