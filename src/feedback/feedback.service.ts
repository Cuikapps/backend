/*
https://docs.nestjs.com/providers#services
*/

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FeedbackDocument } from '../schemas/feedback.schema';
import { FeedbackDto } from './feedback';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel('Feedback-Issue')
    private readonly feedbackIssuesModel: Model<FeedbackDocument>,
    @InjectModel('Feedback-Suggestion')
    private readonly feedbackSuggestionModel: Model<FeedbackDocument>,
    @InjectModel('Feedback-Other')
    private readonly feedbackOtherModel: Model<FeedbackDocument>,
  ) {}

  async create(feedbackDto: FeedbackDto) {
    // Based on the feedback type-the collection is different
    switch (feedbackDto.feedbackType) {
      case 'issue': {
        const feedback = new this.feedbackIssuesModel({
          title: feedbackDto.title,
          app: feedbackDto.app,
          desc: feedbackDto.desc,
        });

        await feedback.save();
        break;
      }
      case 'suggestion': {
        const feedback = new this.feedbackSuggestionModel({
          title: feedbackDto.title,
          app: feedbackDto.app,
          desc: feedbackDto.desc,
        });

        await feedback.save();
        break;
      }
      case 'other': {
        const feedback = new this.feedbackOtherModel({
          title: feedbackDto.title,
          desc: feedbackDto.desc,
        });

        await feedback.save();
        break;
      }
    }
  }
}
