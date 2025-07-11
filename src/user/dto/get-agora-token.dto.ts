import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GetAgoraTokenDto {
  @IsString()
  @ApiProperty({ default: 'hype3' })
  channelName: string;
}
