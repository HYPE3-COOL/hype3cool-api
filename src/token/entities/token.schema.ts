import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, now, SchemaTypes } from 'mongoose';
import MongooseUniqueValidator from 'mongoose-unique-validator';


export type TokenDocument = HydratedDocument<Token>;

@Schema({
  timestamps: true,
})
export class Token {
  @Prop({ required: true, unique: true })
  address: string;

  @Prop({ type: SchemaTypes.String, index: true, sparse: true, default: '' })
  symbol: string;

  @Prop({ type: SchemaTypes.String, default: '' })
  name: string;

  @Prop({ type: SchemaTypes.String, default: '' })
  description: string;

  @Prop({ type: SchemaTypes.String, default: '' })
  imageUri: string;

  @Prop({ type: SchemaTypes.Mixed, default: {} })
  tokenInfo: any;

  // Field to store the original raw data
  @Prop({ type: SchemaTypes.Mixed, default: {} })
  rawData: any;

  @Prop({ default: now(), select: false })
  createdAt: Date;

  @Prop({ default: now(), select: false })
  updatedAt: Date;
}

// https://www.npmjs.com/package/mongoose-unique-validator, custom error message
export const TokenSchema = SchemaFactory.createForClass(Token).plugin(
  MongooseUniqueValidator,
  { message: '{PATH} is already registered!' },
);
