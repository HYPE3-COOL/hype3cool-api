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

export class CreateAdminDto {
  @IsString()
  @IsLowercase()
  @IsNotEmpty()
  @MinLength(2)
  @ApiProperty()
  username: string;

//   @IsEmail()
//   @ApiProperty()
//   email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @ApiProperty()
  password: string;

//   @IsString()
//   @IsNotEmpty()
//   @MinLength(3)
//   @ApiProperty()
//   name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @ApiProperty()
  displayName: string;

//   @IsString()
//   @IsNotEmpty()
//   @MinLength(3)
//   @ApiProperty()
//   avatar: string;

//   @IsString()
//   @IsNotEmpty()
//   @MinLength(3)
//   @ApiProperty()
//   bio: string;

//   @IsArray()
//   roles: string[];

//   @IsBoolean()
//   isEmailVerified: boolean;

//   @IsString()
//   @IsNotEmpty()
//   emailVerificationToken: string;

//   @IsDate()
//   @IsNotEmpty()
//   emailVerificationExpiredAt: Date;

  @IsBoolean()
  isAdmin = false;

//   @IsOptional()
//   @IsObject()
//   companyInfo?: any;
}