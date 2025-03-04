import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 users
    { duration: '1m', target: 20 },  // Stay at 20 users for 1 minute
    { duration: '30s', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'],    // Less than 10% of requests can fail
  },
};

const BASE_URL = 'http://localhost:3000';
const API_KEY = 'test-api-key';

export function setup() {
  // Perform login and get token if needed
  const loginRes = http.post(`${BASE_URL}/auth/login`, {
    email: 'test@example.com',
    password: 'password',
  });
  return { token: loginRes.json('access_token') };
}

export default function(data) {
  const headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  };

  // Create payment
  const paymentRes = http.post(`${BASE_URL}/api/merchant/v1/payments`, JSON.stringify({
    amount: 100,
    currency: 'PI',
    description: 'Test payment',
  }), { headers });

  check(paymentRes, {
    'payment created successfully': (r) => r.status === 201,
    'payment has correct amount': (r) => r.json('data.amount') === 100,
  });

  sleep(1);

  // Get payment status
  const paymentId = paymentRes.json('data.id');
  const statusRes = http.get(`${BASE_URL}/api/merchant/v1/payments/${paymentId}`, { headers });

  check(statusRes, {
    'get payment status successful': (r) => r.status === 200,
    'payment status is valid': (r) => ['pending', 'processing', 'completed'].includes(r.json('data.status')),
  });

  sleep(1);
}