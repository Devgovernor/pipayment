import hmac
import hashlib
import json
from datetime import datetime
from typing import Dict, Optional, Any
import requests

class PiPaymentGateway:
    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.pipaymentgateway.com",
        timeout: int = 10
    ):
        self.api_key = api_key
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
        })

    def _sign_request(self, payload: str) -> str:
        return hmac.new(
            self.api_key.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()

    def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None
    ) -> Dict:
        url = f"{self.base_url}{endpoint}"
        timestamp = datetime.utcnow().isoformat()

        payload = json.dumps({
            'method': method,
            'url': endpoint,
            'body': data,
            'timestamp': timestamp,
        })

        headers = {
            'X-Timestamp': timestamp,
            'X-Signature': self._sign_request(payload),
        }

        try:
            response = self.session.request(
                method=method,
                url=url,
                headers=headers,
                json=data,
                timeout=self.timeout,
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            if e.response is not None:
                raise ValueError(f"API Error {e.response.status_code}: {e.response.text}")
            raise

    def create_payment(
        self,
        amount: float,
        currency: str,
        description: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict:
        """Create a new payment."""
        data = {
            'amount': amount,
            'currency': currency,
            'description': description,
            'metadata': metadata,
        }
        return self._make_request('POST', '/api/merchant/v1/payments', data)

    def get_payment(self, payment_id: str) -> Dict:
        """Get payment status."""
        return self._make_request('GET', f'/api/merchant/v1/payments/{payment_id}')

    def create_refund(
        self,
        payment_id: str,
        amount: float,
        reason: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict:
        """Create a refund for a payment."""
        data = {
            'paymentId': payment_id,
            'amount': amount,
            'reason': reason,
            'metadata': metadata,
        }
        return self._make_request('POST', '/api/merchant/v1/refunds', data)