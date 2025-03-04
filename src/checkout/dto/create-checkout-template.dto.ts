import { IsString, IsObject, IsOptional, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ColorsDto {
  @ApiProperty()
  @IsString()
  primary: string;

  @ApiProperty()
  @IsString()
  secondary: string;

  @ApiProperty()
  @IsString()
  background: string;

  @ApiProperty()
  @IsString()
  text: string;
}

class LogoDto {
  @ApiProperty()
  @IsString()
  url: string;

  @ApiProperty()
  @IsString()
  position: 'left' | 'center' | 'right';
}

class LayoutDto {
  @ApiProperty()
  @IsString()
  type: 'single-page' | 'multi-step';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ each: true })
  steps?: string[];
}

class CustomFieldDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  type: 'text' | 'email' | 'phone' | 'select' | 'checkbox';

  @ApiProperty()
  @IsString()
  label: string;

  @ApiProperty()
  @IsBoolean()
  required: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ each: true })
  options?: string[];
}

class ButtonsDto {
  @ApiProperty()
  @IsString()
  text: string;

  @ApiProperty()
  @IsString()
  style: 'filled' | 'outlined';
}

class TemplateDto {
  @ApiProperty()
  @ValidateNested()
  @Type(() => ColorsDto)
  colors: ColorsDto;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => LogoDto)
  logo?: LogoDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => LayoutDto)
  layout: LayoutDto;

  @ApiProperty()
  @ValidateNested({ each: true })
  @Type(() => CustomFieldDto)
  customFields: CustomFieldDto[];

  @ApiProperty()
  @ValidateNested()
  @Type(() => ButtonsDto)
  buttons: ButtonsDto;
}

export class CreateCheckoutTemplateDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => TemplateDto)
  template: TemplateDto;
}