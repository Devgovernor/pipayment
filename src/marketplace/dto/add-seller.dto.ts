import { IsUUID, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddSellerDto {
  @ApiProperty()
  @IsUUID()
  sellerId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate: number;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;
}