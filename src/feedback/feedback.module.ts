import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FeedbackSchema } from '../schemas/feedback.schema';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        {
          name: 'Feedback-Issue',
          schema: FeedbackSchema,
          collection: 'issues',
        },
      ],
      'Feedback',
    ),
    MongooseModule.forFeature(
      [
        {
          name: 'Feedback-Suggestion',
          schema: FeedbackSchema,
          collection: 'suggestion',
        },
      ],
      'Feedback',
    ),
    MongooseModule.forFeature(
      [
        {
          name: 'Feedback-Other',
          schema: FeedbackSchema,
          collection: 'other',
        },
      ],
      'Feedback',
    ),
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService],
})
export class FeedbackModule {}
