import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserProfileDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @ApiProperty()
  username: string;

  @IsOptional()
  // @IsString()
  // @IsNotEmpty()
  // @MinLength(2)
  @ApiProperty()
  displayName: string;

  @IsOptional()
  // @IsString()
  @ApiProperty()
  bio: string;
}
