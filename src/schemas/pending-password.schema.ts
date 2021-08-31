import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PendingPasswordDocument = PendingPassword & Document;

@Schema()
export class PendingPassword {
  @Prop({ required: true })
  newPassword: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true, index: { expires: 3600 } })
  expire: number;
}

export const PendingPasswordSchema =
  SchemaFactory.createForClass(PendingPassword);
