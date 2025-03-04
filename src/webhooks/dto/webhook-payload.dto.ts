import { IsString, IsUUID, IsEnum, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum WebhookEventType {
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',
  REFUND_COMPLETED = 'refund.completed',
  DISPUTE_CREATED = 'dispute.created',
  DISPUTE_UPDATED = 'dispute.updated',
}

export class WebhookPayloadDto {
  @ApiProperty({ enum: WebhookEventType })
  @IsEnum(WebhookEventType)
  event: WebhookEventType;

  @ApiProperty()
  @IsUUID()
  resource_id: string;

  @ApiProperty()
  @IsString()
  status: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}