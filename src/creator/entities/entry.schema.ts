import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';
import { Subscription } from 'src/subscription/entities/subscription.schema';
import { Creator } from './creator.schema';
import { EntryStatusType, EntryType } from 'src/common/constants';
import { Agent } from 'src/agent/entities/agent.schema';
import { Withdrawal } from './withdrawal.schema';
import { User } from 'src/user/entities/user.schema';

export type EntryDocument = Entry & Document;

@Schema({
  timestamps: true,
})
export class Entry {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  user: User;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Creator', required: true })
  creator: Creator;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Agent' })
  agent: Agent;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Subscription' })
  subscription: Subscription;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Withdrawal' })
  withdrawal: Withdrawal;

  @Prop({ type: String, required: false })
  signature?: string;

  @Prop({ type: String, enum: EntryType, required: true })
  type: string;

  @Prop({ type: String, required: true, nullable: true })
  contractAddress: string;

  @Prop({ type: String, required: false, nullable: true })
  name: string;

  @Prop({ type: String, required: false, nullable: true })
  symbol: string;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: String, enum: EntryStatusType, required: true })
  status: string;

  // @Prop({ type: String, required: false })
  // remarks?: string;
  // Field to store the original raw data
  @Prop({ type: SchemaTypes.Mixed, default: {} })
  rawTransaction: any;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const EntrySchema = SchemaFactory.createForClass(Entry);