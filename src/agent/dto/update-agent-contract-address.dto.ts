import { ApiProperty } from '@nestjs/swagger';

import { IsString } from 'class-validator';

export class UpdateAgentContractAddressDto {
  @ApiProperty()
  @IsString()
  contractAddress: string;
}
