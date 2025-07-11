import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ParseDto {
  @ApiProperty({ default: 'text-to-parse' })
  @IsString()
  @IsNotEmpty()
  text: string; // text to parse
}
