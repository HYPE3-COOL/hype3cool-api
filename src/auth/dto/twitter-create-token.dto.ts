import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class TwitterCreateTokenDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ default: '' })
  code: string;
}
