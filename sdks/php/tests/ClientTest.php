<?php

declare(strict_types=1);

namespace PiPaymentGateway\Tests;

use GuzzleHttp\Client as HttpClient;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use PHPUnit\Framework\TestCase;
use PiPaymentGateway\Client;
use PiPaymentGateway\Exception\ApiException;
use PiPaymentGateway\Exception\ValidationException;

class ClientTest extends TestCase
{
    private MockHandler $mockHandler;
    private Client $client;

    protected function setUp(): void
    {
        $this->mockHandler = new MockHandler();
        $handlerStack = HandlerStack::create($this->mockHandler);
        $httpClient = new HttpClient(['handler' => $handlerStack]);

        $this->client = new Client('test-api-key', 'https://api.test.com', $httpClient);
    }

    public function testCreatePayment(): void
    {
        $this->mockHandler->append(
            new Response(201, [], json_encode([
                'id' => 'pmt_123',
                'amount' => 100.50,
                'currency' => 'PI',
                'status' => 'pending',
            ]))
        );

        $payment = $this->client->createPayment(100.50, 'PI', 'Test payment');

        $this->assertEquals('pmt_123', $payment['id']);
        $this->assertEquals(100.50, $payment['amount']);
        $this->assertEquals('PI', $payment['currency']);
        $this->assertEquals('pending', $payment['status']);
    }

    public function testGetPayment(): void
    {
        $this->mockHandler->append(
            new Response(200, [], json_encode([
                'id' => 'pmt_123',
                'status' => 'completed',
            ]))
        );

        $payment = $this->client->getPayment('pmt_123');

        $this->assertEquals('pmt_123', $payment['id']);
        $this->assertEquals('completed', $payment['status']);
    }

    public function testCreateRefund(): void
    {
        $this->mockHandler->append(
            new Response(201, [], json_encode([
                'id' => 'ref_123',
                'amount' => 100.50,
                'status' => 'pending',
            ]))
        );

        $refund = $this->client->createRefund('pmt_123', 100.50, 'Customer request');

        $this->assertEquals('ref_123', $refund['id']);
        $this->assertEquals(100.50, $refund['amount']);
        $this->assertEquals('pending', $refund['status']);
    }

    public function testValidationError(): void
    {
        $this->mockHandler->append(
            new Response(400, [], json_encode([
                'message' => 'Invalid amount',
            ]))
        );

        $this->expectException(ValidationException::class);
        $this->client->createPayment(-100, 'PI');
    }

    public function testAuthenticationError(): void
    {
        $this->mockHandler->append(
            new Response(401, [], json_encode([
                'message' => 'Invalid API key',
            ]))
        );

        $this->expectException(ApiException::class);
        $this->client->getPayment('pmt_123');
    }
}