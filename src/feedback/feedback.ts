export interface FeedbackDto {
  title: string;
  app: string;
  desc: string;
  feedbackType: 'issue' | 'suggestion' | 'other';
}
