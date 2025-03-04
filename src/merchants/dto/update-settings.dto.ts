import { IsObject, IsOptional, IsBoolean, IsString, IsArray, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

class NotificationSettingsDto {
  @IsOptional()
  @IsBoolean()
  email?: boolean;

  @IsOptional()
  @IsBoolean()
  sms?: boolean;

  @IsOptional()
  @IsBoolean()
  inApp?: boolean;
}

class WebhookSettingsDto {
  @IsOptional()
  @IsString()
  url?: string;
}

class SecuritySettingsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ipWhitelist?: string[];
}

class PreferenceSettingsDto {
  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  @IsIn(['YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY'])
  dateFormat?: string;

  @IsOptional()
  @IsString()
  @IsIn(['PI', 'USD', 'EUR', 'GBP'])
  currency?: string;
}

export class UpdateSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  notifications?: NotificationSettingsDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  webhooks?: WebhookSettingsDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  security?: SecuritySettingsDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  preferences?: PreferenceSettingsDto;
}