import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEmail,
  IsLowercase,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  // @IsLowercase()
  @IsNotEmpty()
  @MinLength(2)
  @ApiProperty()
  username: string;

  @IsBoolean()
  @IsOptional()
  @ApiProperty()
  isCreator: boolean;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @ApiProperty()
  image: string;
}

