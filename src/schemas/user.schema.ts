import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: true })
  displayName!: string;

  @Prop({ required: true })
  photoURL!: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true })
  emailVerified!: boolean;

  @Prop({ required: true })
  password!: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
