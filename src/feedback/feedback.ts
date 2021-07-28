export interface FeedbackDto {
  app: string;
  desc: string;
  feedbackType: 'issue' | 'suggestion' | 'other';
}
