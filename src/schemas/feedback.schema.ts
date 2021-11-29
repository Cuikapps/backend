import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FeedbackDocument = Feedback & Document;

@Schema()
export class Feedback {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: false })
  app!: string;

  @Prop({ required: true })
  desc!: string;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);
