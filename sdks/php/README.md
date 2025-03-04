# Pi Payment Gateway PHP SDK

This SDK provides a simple way to integrate with the Pi Payment Gateway in PHP applications.

## Requirements

- PHP 8.1 or higher
- `ext-json` PHP extension
- Composer

## Installation

```bash
composer require pi-payment-gateway/php-sdk
```

## Usage

```php
use PiPaymentGateway\Client;

// Initialize the client
$gateway = new Client('your-api-key');

try {
    // Create a payment
    $payment = $gateway->createPayment(
        amount: 100.50,
        currency: 'PI',
        description: 'Product purchase',
        metadata: [
            'orderId' => 'ORD123',
            'customerEmail' => 'customer@example.com',
        ]
    );
    
    // Get payment status
    $status = $gateway->getPayment($payment['id']);
    
    // Create a refund
    $refund = $gateway->createRefund(
        paymentId: $payment['id'],
        amount: 100.50,
        reason: 'Customer request'
    );
} catch (ValidationException $e) {
    // Handle validation errors
    echo "Validation error: " . $e->getMessage();
} catch (ApiException $e) {
    // Handle API errors
    echo "API error: " . $e->getMessage();
} catch (Exception $e) {
    // Handle other errors
    echo "Error: " . $e->getMessage();
}
```

## Security

The SDK automatically:
- Signs all requests with your API key
- Uses HTTPS for all API calls
- Includes timestamps to prevent replay attacks

## Development

```bash
# Install dependencies
composer install

# Run tests
composer test

# Run code style checks
composer cs

# Run static analysis
composer stan
```

## License

MIT License