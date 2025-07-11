import {
  IsString,
  IsArray,
  IsNotEmpty,
  IsNumber,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class WithdrawHoldingDto {
  @ApiProperty({ type: String, default: '' })
  @IsNotEmpty()
  @IsString()
  tokenAddress: string;

  @ApiProperty({ type: Number, default: 0 })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({ type: String, default: '' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ type: String, default: '' })
  @IsOptional()
  @IsString()
  symbol?: string;
}

export class CreateWithdrawDto {
  @ApiProperty({ type: String, default: '' })
  @IsNotEmpty()
  @IsString()
  signature: string;

  @ApiProperty({ type: String, default: '' })
  @IsNotEmpty()
  @IsString()
  payerAddress: string;

  @ApiProperty({ type: String, default: '' })
  @IsNotEmpty()
  @IsString()
  receiverAddress: string;

  @ApiProperty({ type: [WithdrawHoldingDto], default: [] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WithdrawHoldingDto)
  holdings: WithdrawHoldingDto[];
}
