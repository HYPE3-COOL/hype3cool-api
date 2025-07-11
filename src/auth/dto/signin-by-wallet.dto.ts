import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class SignInByWalletDto {
  @IsNotEmpty()
  @ApiProperty({ default: 'A8ZSyR8U6ZG2L7Zi2i4TX7W398HRrvnqS7qi1Je2GrBm' })
  wallet: string;

  @IsOptional()
  @ApiProperty({ default: false })
  auto?: boolean;
}
