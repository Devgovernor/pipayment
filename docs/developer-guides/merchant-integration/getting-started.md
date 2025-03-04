# Getting Started with Pi Payment Gateway

## Overview

This guide will help you integrate Pi Payment Gateway into your application to start accepting Pi payments.

## Prerequisites

- A merchant account with Pi Payment Gateway
- API credentials (API key)
- Basic understanding of REST APIs

## Integration Steps

1. **Obtain API Credentials**
   - Log in to your merchant dashboard
   - Navigate to API Keys section
   - Generate a new API key

2. **Install SDK (Optional)**
   ```bash
   npm install pi-payment-gateway-sdk
   ```

3. **Make Your First Payment Request**
   ```javascript
   const PiPaymentGateway = require('pi-payment-gateway-sdk');
   
   const gateway = new PiPaymentGateway({
     apiKey: 'your-api-key',
     sandbox: true // Use sandbox environment for testing
   });
   
   // Create a payment
   const payment = await gateway.payments.create({
     amount: 100,
     currency: 'PI',
     description: 'Test payment'
   });
   ```

## Testing

1. Use the sandbox environment for testing
2. Test different payment scenarios
3. Verify webhook handling

## Going Live

1. Complete the verification process
2. Switch to production API key
3. Update webhook URLs
4. Test with real transactions

## Support

- Documentation: [docs.pipaymentgateway.com](https://docs.pipaymentgateway.com)
- Support Email: support@pipaymentgateway.com
- API Status: [status.pipaymentgateway.com](https://status.pipaymentgateway.com)