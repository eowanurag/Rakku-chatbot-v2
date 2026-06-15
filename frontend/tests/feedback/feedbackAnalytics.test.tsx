import React from 'react';
import '@testing-library/jest-dom';
import { ServiceFeedbackSchema } from '../../src/lib/validation/feedback.schema';

describe('Feedback Analytics Validation', () => {
  it('correctly models and validates required feedback analytics fields', () => {
    const feedbackData = {
      sessionId: 'sess-feedback-123',
      rating: 5,
      comments: 'Awesome service!',
      category: 'PERFORMANCE',
      submittedAt: new Date().toISOString()
    };

    const parsed = ServiceFeedbackSchema.safeParse(feedbackData);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.rating).toBe(5);
      expect(parsed.data.category).toBe('PERFORMANCE');
    }
  });
});
