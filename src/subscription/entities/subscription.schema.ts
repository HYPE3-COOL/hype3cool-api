import { Transform, Type } from 'class-transformer';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, now, SchemaTypes } from 'mongoose';
import MongooseUniqueValidator from 'mongoose-unique-validator';
import { User } from 'src/user/entities/user.schema';
import { TwitterSchema } from 'src/common/schemas/twitter.schema';
import { Agent } from 'src/agent/entities/agent.schema';
import { Creator } from 'src/creator/entities/creator.schema';
import { SubscriptionPlanType } from 'src/common/constants';
import { Character } from 'src/common/interfaces';

export type SubscriptionDocument = HydratedDocument<Subscription>;

export type SocialProfile = {
  url?: string;
  username?: string;
};

@Schema({
  timestamps: true,
})
export class Subscription {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  @Type(() => User)
  user: User;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Agent' })
  @Type(() => Agent)
  agent: Agent;

  @Prop({ required: true })
  startAt: Date;

  @Prop({ required: true })
  endAt: Date;

  // snapshot of character
  @Prop({ type: SchemaTypes.Mixed, default: {} })
  character: Character;

  @Prop({ type: [SchemaTypes.ObjectId], ref: 'Creator' })
  @Type(() => Creator)
  creators: Creator[];

  @Prop({ type: String, enum: SubscriptionPlanType, required: true })
  plan: SubscriptionPlanType;

  @Prop({ type: SchemaTypes.Mixed, default: {} })
  payment: {
      signature: string; // Solana transaction hash
      payerAddress: string;
      receiverAddress: string[];
      amount: number;
      tokenAddress: string;
      name?: string;
      symbol?: string;
      transactionStatus?: string;
  }

  @Prop({ default: now(), select: false })
  createdAt: Date;

  @Prop({ default: now(), select: false })
  updatedAt: Date;
}

// https://www.npmjs.com/package/mongoose-unique-validator, custom error message
export const SubscriptionSchema = SchemaFactory.createForClass(
  Subscription,
).plugin(MongooseUniqueValidator, { message: '{PATH} is already registered!' });
