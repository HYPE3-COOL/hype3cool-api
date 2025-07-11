import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';
import { Creator } from './creator.schema';
import { User } from 'src/user/entities/user.schema';
import { HoldingSchema } from './holding.schema';

export type WithdrawalDocument = Withdrawal & Document;

@Schema({
  timestamps: true,
})
export class Withdrawal {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  user: User;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Creator', required: true })
  creator: Creator;

  @Prop({ type: String, required: false })
  signature: string;

  @Prop({ type: String, required: true })
  payerAddress: string;

  @Prop({ type: String, required: true })
  receiverAddress: string;

  @Prop({ type: [HoldingSchema], default: [] })
  holdings: {
    tokenAddress: string; // key
    amount: number;
    name?: string;
    symbol?: string;
  }[];

  //   @Prop({ type: String, enum: WithdrawalStatusType, required: true })
  //   status: string;

  @Prop({ default: Date.now, select: false })
  createdAt: Date;

  @Prop({ default: Date.now, select: false })
  updatedAt: Date;
}

export const WithdrawalSchema = SchemaFactory.createForClass(Withdrawal);
