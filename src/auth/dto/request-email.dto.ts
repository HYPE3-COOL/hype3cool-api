import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class RequestEmailDto {
  @IsEmail()
  @ApiProperty({ default: 'peter@gmail.com' })
  email: string;
}
