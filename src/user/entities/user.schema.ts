import { Exclude, Type } from 'class-transformer';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, now, SchemaTypes } from 'mongoose';
import MongooseUniqueValidator from 'mongoose-unique-validator';

import { Token } from 'src/token/entities/token.schema';
import { Agent } from 'src/agent/entities/agent.schema';
import { TwitterSchema } from 'src/common/schemas/twitter.schema';

export type UserDocument = HydratedDocument<User>;

export type walletAddress = {
  chain: string;
  address: string;
  display: string;
};

@Schema({
  timestamps: true,
})
export class User {
  @Prop({ type: SchemaTypes.Number, unique: true, sparse: true })
  uid: number;

  @Prop({ type: SchemaTypes.String, unique: true, sparse: true })
  privyUserId: string;

  @Prop({ unique: true, index: 'text' })
  username: string;

  @Prop({ type: SchemaTypes.Mixed })
  linkedAccounts: any[];

  // @Prop()
  // @Exclude()
  // password: string; // hashed password

  // @Prop()
  // displayName: string;

  @Prop({ default: '' })
  image: string;

  @Prop({ type: SchemaTypes.Boolean, default: false })
  isNewUser: boolean;

  @Prop({ type: SchemaTypes.Boolean, default: false })
  isCreator: boolean;

  // if the user is platform admin
  @Prop({ type: SchemaTypes.Boolean, default: false })
  isAdmin: boolean;

  @Prop({ type: TwitterSchema })
  twitter: {
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
    joined?: Date;
  };

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Agent' })
  @Type(() => Agent)
  agent: Agent;

  @Prop({ type: [SchemaTypes.ObjectId], ref: 'Token' })
  bookmarkedTokens: Token[];

  @Prop({ type: [SchemaTypes.ObjectId], ref: 'Token' })
  favoriteTokens: Token[];

  @Prop({ default: now(), select: false })
  createdAt: Date;

  @Prop({ default: now(), select: false })
  updatedAt: Date;
}

// https://www.npmjs.com/package/mongoose-unique-validator, custom error message
export const UserSchema = SchemaFactory.createForClass(User).plugin(
  MongooseUniqueValidator,
  { message: '{PATH} is already registered!' },
);

// // UserSchema.pre('validate', async function (next: any) {})
// UserSchema.pre('save', async function (next: any) {
//   try {
//     // check if it is modified
//     if (!this.isModified('password')) {
//       return next();
//     }
//     // hash the password
//     const hashedPassword = await bcrypt.hash(this.password, 10);
//     // set to the newly hashed password
//     this.password = hashedPassword;
//     // call the nest operation
//     return next();
//   } catch (error) {
//     return next(error);
//   }
// });
