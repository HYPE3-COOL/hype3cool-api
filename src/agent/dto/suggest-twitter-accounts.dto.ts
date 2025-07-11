import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsString } from 'class-validator';

export class SuggestTwitterAccountsDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  username: string;
}
