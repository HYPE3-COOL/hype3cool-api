import { ApiProperty } from '@nestjs/swagger';

import { IsArray, IsString } from 'class-validator';

export class GenerateBasicCharacterDto {
  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  usernames: string[];
}
