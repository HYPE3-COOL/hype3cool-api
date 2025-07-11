import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateAgentAccessTokensDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  accessToken: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  refreshToken: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  scope: string;

  @ApiProperty()
  @IsNotEmpty()
  expiresIn: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  tokenType: string;
}