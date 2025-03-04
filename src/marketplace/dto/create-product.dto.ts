import { IsString, IsNumber, IsOptional, Min, IsEnum, ValidateNested, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductType } from '../enums/product-type.enum';

class DigitalContentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  downloadUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accessInstructions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  expiryDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxDownloads?: number;
}

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty()
  @IsString()
  currency: string;

  @ApiProperty({ enum: ProductType })
  @IsEnum(ProductType)
  type: ProductType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  inventoryCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => DigitalContentDto)
  digitalContent?: DigitalContentDto;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;
}