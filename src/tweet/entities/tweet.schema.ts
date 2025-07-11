import { Transform, Type } from 'class-transformer';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, now, SchemaTypes } from 'mongoose';
import MongooseUniqueValidator from 'mongoose-unique-validator';
import { User } from 'src/user/entities/user.schema';
import { TwitterSchema } from 'src/common/schemas/twitter.schema';
import { Character } from 'src/common/interfaces';
import { Subscription } from 'src/subscription/entities/subscription.schema';
import { Agent } from 'src/agent/entities/agent.schema';

export type TweetDocument = HydratedDocument<Tweet>;

export type SocialProfile = {
  url?: string;
  username?: string;
};

@Schema({
  timestamps: true,
})
export class Tweet {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Agent' })
  @Type(() => Agent)
  agent: Agent;

  // @Prop({ index: true })
  // twitterId: string;

  @Prop({ type: SchemaTypes.String, default: '' })
  content: string;

  @Prop({ type: SchemaTypes.Boolean, default: false })
  isSent: boolean;

  @Prop({ default: now() })     // generated time
  createdAt: Date;

  @Prop({ default: now() })
  updatedAt: Date;
}

// https://www.npmjs.com/package/mongoose-unique-validator, custom error message
export const TweetSchema = SchemaFactory.createForClass(Tweet).plugin(
  MongooseUniqueValidator,
  { message: '{PATH} is already registered!' },
);
