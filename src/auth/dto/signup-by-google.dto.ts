import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class SignUpByGoogleDto {
  
  @IsEmail()
  @ApiProperty({ default: 'abc@gmail.com' })
  email: string;

  @IsNotEmpty()
  @ApiProperty({ default: 'A8ZSyR8U6ZG2L7Zi2i4TX7W398HRrvnqS7qi1Je2GrBm' })
  name: string;

  @IsNotEmpty()
  @ApiProperty({ default: 'A8ZSyR8U6ZG2L7Zi2i4TX7W398HRrvnqS7qi1Je2GrBm' })
  verifierId: string;

  @IsNotEmpty()
  @ApiProperty({ default: 'https://lh3.googleusercontent.com/a/ACg8ocJCCHBsXL8xQm0m0Wfnhr6erDFFYELj9P5rUh-oKMSGq-djKg=s96-c' })
  profileImage: string;

  @IsNotEmpty()
  @ApiProperty({ default: 'A8ZSyR8U6ZG2L7Zi2i4TX7W398HRrvnqS7qi1Je2GrBm' })
  wallet: string;

  @IsOptional()
  @ApiProperty({ default: false })
  autoSignUp?: boolean;  
}
