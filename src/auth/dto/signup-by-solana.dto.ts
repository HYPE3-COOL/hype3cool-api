import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class SignUpBySolanaDto {
  @IsNotEmpty()
  @ApiProperty({ default: 'A8ZSyR8U6ZG2L7Zi2i4TX7W398HRrvnqS7qi1Je2GrBm' })
  wallet: string;

  @IsOptional()
  @ApiProperty({ default: false })
  autoSignUp?: boolean;  

  // @IsNotEmpty()
  // @Matches(/^[^\s]{1,}$/, {
  //   message: 'Username cannot contain spaces.',
  // })
  // @ApiProperty({ default: 'john' })
  // username: string;
}
