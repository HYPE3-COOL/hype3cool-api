import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateUserTwitterProfileDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ default: '' })
  id: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ default: '' })
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ default: '' })
  username: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ default: '' })
  image: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ default: '' })
  description: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ default: '' })
  banner: string;

  @IsOptional()
  @ApiProperty({ default: false })
  verified: boolean;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  biography?: string;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ required: false })
  followersCount?: number;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ required: false })
  followingCount?: number;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ required: false })
  friendsCount?: number;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ required: false })
  mediaCount?: number;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  isPrivate?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  isVerified?: boolean;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ required: false })
  likesCount?: number;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ required: false })
  listedCount?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  location?: string;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ required: false })
  tweetsCount?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  url?: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  isBlueVerified?: boolean;

  @IsOptional()
  // @IsDate()
  @ApiProperty({ required: false })
  joined?: Date;
}
