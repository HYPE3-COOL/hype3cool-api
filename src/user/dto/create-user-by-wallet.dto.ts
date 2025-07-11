import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsLowercase,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserByWalletDto {
  @IsString()
  @IsLowercase()
  @IsNotEmpty()
  @MinLength(2)
  @ApiProperty()
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @ApiProperty()
  displayName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @ApiProperty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  wallet: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @ApiProperty()
  avatar: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @ApiProperty()
  bio: string;

  @IsArray()
  roles: string[];
}
