import { ApiProperty } from '@nestjs/swagger';

import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class GenerateCharacterDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  intro: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  language: string;
  
  @ApiProperty()
  @IsBoolean()
  withHashTags: boolean;
}
