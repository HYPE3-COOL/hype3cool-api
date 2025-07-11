import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsArray, IsDate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


import { ChainType, SocialProfiles } from 'src/common/constants';

export class CreateTokenDto {
  @ApiProperty({ default: ''})
  @IsString()
  @IsNotEmpty()
  symbol: string;

  @ApiProperty({ default: ''})
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ default: ''})
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty({ default: ''})
  @IsString()
  @IsOptional()
  imageUri: string;

  @ApiProperty({ default: ''})
  @IsString()
  @IsNotEmpty()
  metadataUri: string;

  @ApiProperty({ default: ''})
  @IsString()
  @IsOptional()
  mint: string;  

  @ApiProperty({ default: ChainType.SOL})
  @IsEnum(ChainType)
  @IsNotEmpty()
  chain: ChainType;

  @ApiProperty()
  @IsOptional()
  socials: SocialProfiles;

  @ApiProperty()
  @IsArray()
  @IsOptional()
  categories: string[];

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  seq: number;
}