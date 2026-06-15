import React from 'react';
import '@testing-library/jest-dom';
import enFeedback from '../../src/locales/en/feedback.json';
import hiFeedback from '../../src/locales/hi/feedback.json';
import hinglishFeedback from '../../src/locales/hinglish/feedback.json';

describe('Feedback Localization Coverage', () => {
  it('covers translations across all language namespaces', () => {
    const namespaces = ['rating', 'categories'];

    namespaces.forEach((ns) => {
      expect((enFeedback as any)[ns]).toBeDefined();
      expect((hiFeedback as any)[ns]).toBeDefined();
      expect((hinglishFeedback as any)[ns]).toBeDefined();
    });
  });
});
