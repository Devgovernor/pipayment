import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ImpersonateDto {
  @ApiProperty()
  @IsUUID()
  userId: string;
}