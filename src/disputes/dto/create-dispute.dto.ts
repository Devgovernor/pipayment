import { IsString, IsUUID, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DisputeReason } from '../enums/dispute-reason.enum';

export class CreateDisputeDto {
  @ApiProperty()
  @IsUUID()
  paymentId: string;

  @ApiProperty({ enum: DisputeReason })
  @IsEnum(DisputeReason)
  reason: DisputeReason;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;
}