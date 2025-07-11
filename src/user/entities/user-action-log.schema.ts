// src/user/user-action-log.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes } from 'mongoose';

import { Token } from 'src/token/entities/token.schema';
import { User } from './user.schema';
import { UserActionType } from './user-action-type.enum';
import { Type } from 'class-transformer';

export type UserActionLogDocument = HydratedDocument<UserActionLog>;

@Schema({
  timestamps: true,
})
export class UserActionLog {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  user: User;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Token', required: true })
  token: Token;

  @Prop({ type: String, enum: Object.values(UserActionType), required: true })
  @Type(() => String)
  actionType: UserActionType; // Define the type of action
}

export const UserActionLogSchema = SchemaFactory.createForClass(UserActionLog);
