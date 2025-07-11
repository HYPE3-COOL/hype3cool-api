import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateUserWalletDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  wallet: string;
}
