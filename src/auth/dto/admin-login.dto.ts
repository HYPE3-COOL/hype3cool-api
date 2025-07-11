import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class AdminLoginDto {
  @IsString()
  @ApiProperty({ default: 'peter' })
  username: string;

  // @IsStrongPassword()
  @MinLength(8)
  @ApiProperty({ default: '12341234' })
  password: string;
}
