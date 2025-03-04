import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddCommentDto {
  @ApiProperty()
  @IsString()
  comment: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  internal?: boolean;
}