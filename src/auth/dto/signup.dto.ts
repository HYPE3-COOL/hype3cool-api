import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, Matches } from 'class-validator';

export class SignUpDto {
  // @IsEmail()
  // @ApiProperty({ default: 'peter@gmail.com' })
  // email: string;

  @IsNotEmpty()
  @ApiProperty({ default: '12341234' })
  password: string;

  @IsNotEmpty()
  @Matches(/^[^\s]{1,}$/, {
    message: 'Username cannot contain spaces.',
  })
  @ApiProperty({ default: 'peter' })
  username: string;
}