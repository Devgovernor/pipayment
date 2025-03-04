# Pi Payment Gateway Backend

A robust payment processing system built with NestJS for handling Pi Network payments.

## Description

This project is a comprehensive payment gateway backend that facilitates payment processing through the Pi Network. It provides both Admin and Merchant APIs with versioning support.

## Features

- Admin API for system management
- Versioned Merchant API for payment processing
- PostgreSQL database with TypeORM
- Redis-based queue system with Bull
- Scheduled tasks
- Swagger/OpenAPI documentation
- Authentication and Authorization
- Rate limiting
- Audit logging
- Webhook management
- Settlement processing
- Dispute handling
- KYC verification
- API key management

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## API Documentation

- Admin API: http://localhost:3000/api/admin
- Merchant API v1: http://localhost:3000/api/merchant/v1

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=pi_payment_gateway

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1h

# Pi Network
PI_NETWORK_API_KEY=your_api_key
PI_NETWORK_API_SECRET=your_api_secret
PI_NETWORK_SANDBOX=true
```

## Project Structure

```
src/
├── auth/           # Authentication module
├── payments/       # Payments module with versioned Merchant API
├── merchants/      # Merchants module
├── transactions/   # Transactions module
├── refunds/        # Refunds module
├── webhooks/       # Webhooks module
├── settlements/    # Settlements module
├── disputes/       # Disputes module
├── kyc/            # KYC module
├── api-keys/       # API Keys module
├── queue/          # Queue module (Bull)
├── scheduler/      # Scheduler module
└── common/         # Shared components
```

## License

This project is proprietary and confidential.