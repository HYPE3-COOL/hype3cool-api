import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty()
  @ApiProperty({ default: '12341234' })
  password: string;

  @IsNotEmpty()
  @ApiProperty({ default: '28c2b90aa8874f86991e9aa8e83d4260' })
  token: string;
}
