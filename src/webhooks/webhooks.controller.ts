import { Controller, Post, Body, Headers, HttpCode, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { WebhookPayloadDto, WebhookEventType } from './dto/webhook-payload.dto';
import { WebhookGuard } from './guards/webhook.guard';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  @HttpCode(200)
  @UseGuards(WebhookGuard)
  @ApiSecurity('webhook-signature')
  @ApiOperation({ summary: 'Handle webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleWebhook(
    @Headers('x-webhook-signature') signature: string,
    @Body() payload: WebhookPayloadDto,
  ) {
    switch (payload.event) {
      case WebhookEventType.PAYMENT_COMPLETED:
      case WebhookEventType.PAYMENT_FAILED:
        await this.webhooksService.handlePaymentWebhook(payload);
        break;
      case WebhookEventType.REFUND_COMPLETED:
        await this.webhooksService.handleRefundWebhook(payload);
        break;
      case WebhookEventType.DISPUTE_CREATED:
      case WebhookEventType.DISPUTE_UPDATED:
        await this.webhooksService.handleDisputeWebhook(payload);
        break;
    }

    return { received: true };
  }
}