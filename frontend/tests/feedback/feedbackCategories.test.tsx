import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import enFeedback from '../../src/locales/en/feedback.json';

describe('Feedback Categories Validation', () => {
  it('defines all required feedback categories in localization packs', () => {
    const requiredCategories = [
      'LOCALIZATION',
      'CONFUSING_FLOW',
      'DUPLICATE_DATA_COLLECTION',
      'LOCATION_ERROR',
      'TRACKING_ISSUE',
      'VERIFICATION_ISSUE',
      'UI_PROBLEM',
      'PERFORMANCE',
      'OTHER'
    ];

    requiredCategories.forEach((cat) => {
      expect((enFeedback.categories as any)[cat]).toBeDefined();
    });
  });
});
