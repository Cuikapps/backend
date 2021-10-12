import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.schema';

export type AppDocument = App & Document;

@Schema()
export class App {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  owner: User;

  @Prop({ required: true })
  created: string;

  @Prop({ required: true })
  updated: string;

  @Prop({ required: true })
  downloads: number;

  @Prop({ required: true })
  image: string;

  @Prop({ required: true })
  ratedBy: [
    {
      uid: string;
      rating: number;
    },
  ];

  @Prop({ required: true })
  numberOfReviews: number;

  @Prop({ required: true })
  stars: number;
}

export const AppSchema = SchemaFactory.createForClass(App);
