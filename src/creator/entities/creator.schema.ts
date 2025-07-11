import { Transform, Type } from 'class-transformer';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, now, SchemaTypes } from 'mongoose';
import MongooseUniqueValidator from 'mongoose-unique-validator';
import { User } from 'src/user/entities/user.schema';
import { TwitterSchema } from 'src/common/schemas/twitter.schema';
import { Subscription } from 'src/subscription/entities/subscription.schema';
import { Entry } from './entry.schema';
import { HoldingSchema } from './holding.schema';
import { Agent } from 'src/agent/entities/agent.schema';

export type CreatorDocument = HydratedDocument<Creator>;

@Schema({
  timestamps: true,
})
export class Creator {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  @Type(() => User)
  user: User;

  @Prop({ type: [SchemaTypes.ObjectId], ref: 'Agent' })
  @Type(() => Agent)
  agents: Agent[];

  @Prop({ unique: true, index: 'text' }) // twitter username
  username: string;

  @Prop({ default: '' }) // twitter image
  image: string;

  @Prop({ type: TwitterSchema })
  twitter: {
    id: string;
    name: string; // displayName
    username: string;
    image: string;
    description?: string;
    biography?: string;
    avatar?: string;
    banner?: string;
    verified?: boolean;
    followersCount?: number;
    followingCount?: number;
    friendsCount?: number;
    mediaCount?: number;
    // isPrivate?: boolean;
    // isVerified?: boolean;
    likesCount?: number;
    listedCount?: number;
    location?: string;
    tweetsCount?: number;
    url?: string;
    // isBlueVerified?: boolean;
    joined?: Date;
  };

  @Prop({ type: Number, default: 0 })
  agentCount: number;

  @Prop({ type: Number, default: 0 })
  earned: number;

  @Prop({ type: SchemaTypes.Boolean, default: false })
  isShow: boolean;

  @Prop({ type: [SchemaTypes.ObjectId], ref: 'Entry' })
  @Type(() => Entry)
  entries: Entry[];

  @Prop({ type: [HoldingSchema], default: [] })
  holdings: {
    tokenAddress: string; // key
    amount: number;
    name?: string;
    symbol?: string;
  }[];

  @Prop({ default: now() })
  createdAt: Date;

  @Prop({ default: now() })
  updatedAt: Date;
}

// https://www.npmjs.com/package/mongoose-unique-validator, custom error message
export const CreatorSchema = SchemaFactory.createForClass(Creator).plugin(
  MongooseUniqueValidator,
  { message: '{PATH} is already registered!' },
);
