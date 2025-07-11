import { Transform, Type } from 'class-transformer';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, now, SchemaTypes } from 'mongoose';
import MongooseUniqueValidator from 'mongoose-unique-validator';

import { User } from 'src/user/entities/user.schema';
import { Creator } from 'src/creator/entities/creator.schema';
import { Agent } from 'src/agent/entities/agent.schema';
import { Subscription } from 'src/subscription/entities/subscription.schema';

export type TransactionDocument = HydratedDocument<Transaction>;

@Schema({
  timestamps: true,
})
export class Transaction {
  @Prop({ required: true, unique: true })
  signature: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  fromAddress: string;

  @Prop({ required: true })
  toAddress: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  @Type(() => User)
  user: User;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Creator' })
  @Type(() => Creator)
  creator: Creator;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Agent' })
  @Type(() => Agent)
  agent: Agent;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Subscription' })
  @Type(() => Subscription)
  subscription: Subscription;

  @Prop({ type: String, default: 'pending' })
  status: string; // e.g., pending, completed, failed  

  @Prop({ default: now() })
  createdAt: Date;

  @Prop({ default: now() })
  updatedAt: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(
  Transaction,
).plugin(MongooseUniqueValidator, { message: '{PATH} is already registered!' });

// status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' }, // Status of the transaction
