import {
  IsString,
  IsArray,
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  ValidateNested,
  IsNumber,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

import { SubscriptionPlanType } from 'src/common/constants';
import { ApiProperty } from '@nestjs/swagger';

export class SubscriptionPaymentDto {
  @ApiProperty({ type: String, default: '' })
  @IsNotEmpty()
  @IsString()
  signature: string;

  @ApiProperty({ type: String, default: '' })
  @IsNotEmpty()
  @IsString()
  payerAddress: string;

  @ApiProperty({ type: [String], default: [] })
  @IsArray()
  @IsOptional()
  receiverAddress: string[];

  @ApiProperty({ type: String, default: '' })
  @IsNotEmpty()
  @IsString()
  tokenAddress: string;

  @ApiProperty({ type: String, default: '' })
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({ type: String, default: '' })
  @IsOptional()
  @IsString()
  symbol: string;

  @ApiProperty({ type: Number, default: '' })
  @IsNotEmpty()
  @IsNumber()
  amount: number;
}

export class CreateSubscriptionDto {
  @ApiProperty({ type: String, default: '' })
  @IsString()
  @IsNotEmpty()
  agent: string; // Agent ID

  @ApiProperty({ type: String, default: '' })
  @IsString()
  @IsEnum(SubscriptionPlanType)
  @IsNotEmpty()
  plan: SubscriptionPlanType;

  @ApiProperty({ type: String, default: '' })
  @IsString()
  @IsOptional()
  contractAddress: string;

  @ApiProperty({
    type: 'object',
    properties: {
      signature: { type: 'string' },
      payerAddress: { type: 'string' },
      receiverAddress: { type: 'array', items: { type: 'string' } },
      tokenAddress: { type: 'string' },
      name: { type: 'string' },
      symbol: { type: 'string' },
      amount: { type: 'number' },
    },
    default: {
      signature: '',
      payerAddress: '',
      receiverAddress: [],
      tokenAddress: '',
      name: '',
      symbol: '',
      amount: 0,
    },
  })
  @ValidateIf((o) => o.plan === SubscriptionPlanType.MONTHLY)
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => SubscriptionPaymentDto)
  payment: SubscriptionPaymentDto;
}
