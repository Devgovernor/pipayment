<?php

declare(strict_types=1);

namespace PiPaymentGateway;

use GuzzleHttp\Client as HttpClient;
use GuzzleHttp\Exception\GuzzleException;
use PiPaymentGateway\Exception\ApiException;
use PiPaymentGateway\Exception\ValidationException;

class Client
{
    private HttpClient $httpClient;
    private string $apiKey;

    public function __construct(
        string $apiKey,
        string $baseUrl = 'https://api.pipaymentgateway.com',
        ?HttpClient $httpClient = null
    ) {
        $this->apiKey = $apiKey;
        $this->httpClient = $httpClient ?? new HttpClient([
            'base_uri' => $baseUrl,
            'timeout' => 10.0,
            'headers' => [
                'Authorization' => "Bearer {$apiKey}",
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ],
        ]);
    }

    /**
     * Create a new payment
     *
     * @param float $amount
     * @param string $currency
     * @param string|null $description
     * @param array<string, mixed>|null $metadata
     * @return array<string, mixed>
     * @throws ApiException|ValidationException
     */
    public function createPayment(
        float $amount,
        string $currency,
        ?string $description = null,
        ?array $metadata = null
    ): array {
        $data = [
            'amount' => $amount,
            'currency' => $currency,
        ];

        if ($description !== null) {
            $data['description'] = $description;
        }

        if ($metadata !== null) {
            $data['metadata'] = $metadata;
        }

        return $this->request('POST', '/api/merchant/v1/payments', $data);
    }

    /**
     * Get payment details
     *
     * @param string $paymentId
     * @return array<string, mixed>
     * @throws ApiException
     */
    public function getPayment(string $paymentId): array
    {
        return $this->request('GET', "/api/merchant/v1/payments/{$paymentId}");
    }

    /**
     * Create a refund
     *
     * @param string $paymentId
     * @param float $amount
     * @param string $reason
     * @param array<string, mixed>|null $metadata
     * @return array<string, mixed>
     * @throws ApiException|ValidationException
     */
    public function createRefund(
        string $paymentId,
        float $amount,
        string $reason,
        ?array $metadata = null
    ): array {
        $data = [
            'paymentId' => $paymentId,
            'amount' => $amount,
            'reason' => $reason,
        ];

        if ($metadata !== null) {
            $data['metadata'] = $metadata;
        }

        return $this->request('POST', '/api/merchant/v1/refunds', $data);
    }

    /**
     * Make an HTTP request to the API
     *
     * @param string $method
     * @param string $endpoint
     * @param array<string, mixed>|null $data
     * @return array<string, mixed>
     * @throws ApiException|ValidationException
     */
    private function request(string $method, string $endpoint, ?array $data = null): array
    {
        $timestamp = (new \DateTime())->format(\DateTime::ATOM);
        $payload = json_encode([
            'method' => $method,
            'url' => $endpoint,
            'body' => $data,
            'timestamp' => $timestamp,
        ]);

        $signature = hash_hmac('sha256', $payload, $this->apiKey);

        try {
            $response = $this->httpClient->request($method, $endpoint, [
                'json' => $data,
                'headers' => [
                    'X-Timestamp' => $timestamp,
                    'X-Signature' => $signature,
                ],
            ]);

            /** @var array<string, mixed> */
            return json_decode($response->getBody()->getContents(), true);
        } catch (GuzzleException $e) {
            if ($e->getCode() === 400) {
                throw new ValidationException('Invalid request data', 400, $e);
            }

            if ($e->getCode() === 401) {
                throw new ApiException('Invalid API key', 401, $e);
            }

            if ($e->getCode() === 429) {
                throw new ApiException('Rate limit exceeded', 429, $e);
            }

            throw new ApiException('API request failed: ' . $e->getMessage(), $e->getCode(), $e);
        }
    }
}