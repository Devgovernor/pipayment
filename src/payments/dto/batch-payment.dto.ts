import { IsString, IsNumber, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class BatchPaymentItemDto {
  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsString()
  recipientId: string;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class BatchPaymentDto {
  @ApiProperty()
  @IsString()
  currency: string;

  @ApiProperty({ type: [BatchPaymentItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchPaymentItemDto)
  items: BatchPaymentItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;
}