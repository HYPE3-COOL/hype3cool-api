import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class SignInDto {
  @IsEmail()
  @ApiProperty({ default: 'peter@gmail.com' })
  email: string;

  @IsNotEmpty()
  @ApiProperty({ default: '12341234' })
  password: string;
}
