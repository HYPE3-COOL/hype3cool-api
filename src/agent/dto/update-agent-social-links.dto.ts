import { ApiProperty } from '@nestjs/swagger';

import { IsOptional, IsString } from 'class-validator';

export class UpdateAgentSocialLinksDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  twitter: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  telegram: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  discord: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  website: string;
}
