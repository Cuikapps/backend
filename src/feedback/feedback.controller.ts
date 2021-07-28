/*
https://docs.nestjs.com/controllers#controllers
*/

import { Body, Controller, HttpException, Post } from '@nestjs/common';
import { FeedbackDto } from './feedback';
import { FeedbackService } from './feedback.service';

@Controller('/feedback')
export class FeedbackController {
  constructor(private readonly feedback: FeedbackService) {}

  @Post('/new')
  newFeedback(@Body() feedback: FeedbackDto) {
    try {
      this.feedback.create(feedback);
    } catch (error) {
      return new HttpException(error, 500);
    }
  }
}
