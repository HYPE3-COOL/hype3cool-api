import { Transform, Type } from 'class-transformer';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, now, SchemaTypes } from 'mongoose';
import MongooseUniqueValidator from 'mongoose-unique-validator';
import { User } from 'src/user/entities/user.schema';
import { TwitterSchema } from 'src/common/schemas/twitter.schema';
import { Character } from 'src/common/interfaces';
import { Subscription } from 'src/subscription/entities/subscription.schema';

export type AgentDocument = HydratedDocument<Agent>;

export type SocialProfile = {
  url?: string;
  username?: string;
};

@Schema({
  timestamps: true,
})
export class Agent {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  @Type(() => User)
  user: User;

  @Prop({ index: true })
  name: string;

  @Prop()
  avatar: string; // URL of the generated profile picture

  @Prop({ type: SchemaTypes.Mixed, default: {} })
  character: Character;

  @Prop({ type: TwitterSchema, nullable: true })
  twitter?: {
    id: string;
    name: string; // displayName
    username: string;
    image: string;
    description?: string;
    biography?: string;
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

  @Prop({ type: SchemaTypes.Mixed, nullable: true })
  discord?: SocialProfile;

  @Prop({ type: SchemaTypes.Mixed, nullable: true })
  telegram?: SocialProfile;

  @Prop({ type: SchemaTypes.Mixed, nullable: true })
  website?: SocialProfile;

  @Prop({ type: [TwitterSchema], default: [] })
  suggestions: {
    id: string;
    name: string; // displayName
    username: string;
    image: string;
    avatar?: string;
    description?: string;
    biography?: string;
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
  }[];

  @Prop({ index: true, sparse: true, nullable: true })
  contractAddress: string;

  @Prop({ type: SchemaTypes.Boolean, default: false })
  isActive: boolean;

  @Prop({ type: SchemaTypes.Boolean, default: false })
  isSubscribed: boolean;

  @Prop({ required: false })
  startAt: Date;

  @Prop({ required: false })
  endAt: Date;

  @Prop({ type: [SchemaTypes.ObjectId], ref: 'Subscription' })
  @Type(() => Subscription)
  subscriptions: Subscription[];

  @Prop({ type: SchemaTypes.Mixed, default: {} })
  token?: {
    address: string;
    name?: string;
    symbol?: string;
    supply?: number;
    price?: number;
    decimals?: number;
  };

  // deprecated soon
  @Prop({ nullable: true, select: false })
  encryptedCredentials: string;

  @Prop({ type: SchemaTypes.Mixed, default: {}, select: false })
  twitterOauth?: {
    id: string;
    accessToken: string;
    refreshToken: string;
    isAuthenticated: boolean;
    postTweetsInterval: number; // in minutes
    createdAt: Date;
    updatedAt: Date;
    lastTweetedAt?: Date;
    lastTrialAt?: Date;
    scope: string;
    expiresIn: number;
    lastAuthorizedAt?: Date;
  };

  @Prop({ default: now() })
  createdAt: Date;

  @Prop({ default: now() })
  updatedAt: Date;
}

// https://www.npmjs.com/package/mongoose-unique-validator, custom error message
export const AgentSchema = SchemaFactory.createForClass(Agent).plugin(
  MongooseUniqueValidator,
  { message: '{PATH} is already registered!' },
);
