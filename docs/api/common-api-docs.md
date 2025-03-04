# Pi Payment Gateway API Documentation

## Overview

The Pi Payment Gateway provides two distinct APIs:

1. Admin API - For system administration and management
2. Merchant API - For payment processing and merchant operations

## Authentication

### Admin API

The Admin API uses JWT-based authentication. To authenticate:

1. Obtain a JWT token by calling the login endpoint
2. Include the token in the Authorization header:
   ```
   Authorization: Bearer <token>
   ```

### Merchant API

The Merchant API uses API key authentication. To authenticate:

1. Obtain an API key from the merchant dashboard
2. Include the API key in the Authorization header:
   ```
   Authorization: Bearer <api-key>
   ```

## API Versioning

The Merchant API is versioned using URL prefixes:

- V1: `/api/merchant/v1/`
- V2: `/api/merchant/v2/`

## Response Format

All API responses follow a standard format:

```json
{
  "data": {
    // Response data
  },
  "meta": {
    "timestamp": "2025-02-15T12:00:00Z",
    "path": "/api/endpoint"
  }
}
```

## Error Handling

Error responses follow a standard format:

```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Error type",
  "timestamp": "2025-02-15T12:00:00Z",
  "path": "/api/endpoint"
}
```

## Rate Limiting

API endpoints are rate-limited to protect the system. Rate limits are specified in the response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1623456789
```