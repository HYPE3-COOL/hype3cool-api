import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdateUserAvatarDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @ApiProperty()
  image: string;
}
