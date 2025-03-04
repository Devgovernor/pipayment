import { IsString, IsNumber, IsEnum, IsOptional, Min, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionInterval } from '../enums/subscription-interval.enum';

export class CreateSubscriptionDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty()
  @IsString()
  currency: string;

  @ApiProperty({ enum: SubscriptionInterval })
  @IsEnum(SubscriptionInterval)
  interval: SubscriptionInterval;

  @ApiProperty()
  @IsInt()
  @Min(1)
  intervalCount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  trialPeriodDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;
}