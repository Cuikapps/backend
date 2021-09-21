import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserConfigDocument = UserConfig & Document;

@Schema()
export class UserConfig {
  @Prop({ required: true })
  installedApps: string[];
}

export const UserConfigSchema = SchemaFactory.createForClass(UserConfig);
