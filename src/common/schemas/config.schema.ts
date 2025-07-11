import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes } from 'mongoose';
import MongooseUniqueValidator from 'mongoose-unique-validator';

export type ConfigDocument = HydratedDocument<Config>;
@Schema({
  timestamps: false,
})
export class Config {
  @Prop({ required: true })
  name: string;

  @Prop({ type: SchemaTypes.Number })
  value: number;

  @Prop({ type: SchemaTypes.String })
  description: string;

  @Prop({ type: SchemaTypes.String })
  valueInString: string;

  @Prop({ type: SchemaTypes.Date, default: Date.now })
  updatedAt: Date;
}

export const ConfigSchema = SchemaFactory.createForClass(Config).plugin(
  MongooseUniqueValidator,
);
