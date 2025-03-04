import { IsObject, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

class NotificationChannelsDto {
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

class NotificationEventsDto {
  @IsOptional()
  @IsBoolean()
  payments?: boolean;

  @IsOptional()
  @IsBoolean()
  refunds?: boolean;

  @IsOptional()
  @IsBoolean()
  disputes?: boolean;

  @IsOptional()
  @IsBoolean()
  settlements?: boolean;
}

export class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  channels?: NotificationChannelsDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  events?: NotificationEventsDto;
}