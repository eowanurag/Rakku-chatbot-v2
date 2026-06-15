export interface ServiceFeedback {
  sessionId: string;
  rating: number; // 1 to 5
  comments?: string;
  category: string;
  submittedAt: string;
}
