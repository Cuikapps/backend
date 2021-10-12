import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserConfigDocument = UserConfig & Document;

@Schema()
export class UserConfig {
  @Prop({ required: true })
  uid: string;

  @Prop({ required: true })
  searchEngine: string;

  @Prop({ required: true })
  mailProvider: string;

  @Prop({ required: true })
  theme: string;

  @Prop({ required: true })
  searchHistory: string[];
}

export const UserConfigSchema = SchemaFactory.createForClass(UserConfig);
