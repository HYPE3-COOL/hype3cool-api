import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsString } from 'class-validator';

export class GenerateImageDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  prompt: string;
}
