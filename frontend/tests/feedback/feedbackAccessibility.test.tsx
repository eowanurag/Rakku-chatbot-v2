import React from 'react';
import '@testing-library/jest-dom';
import Announcements from '../../src/lib/accessibility/announcements';

describe('Feedback Accessibility Auditing', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'rakku-live-announcer';
    container.className = 'sr-only';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('triggers accessibility live announcements correctly for feedback states', (done) => {
    Announcements.announce('Thank you for your feedback.', 'polite');

    setTimeout(() => {
      expect(container.textContent).toBe('Thank you for your feedback.');
      done();
    }, 150);
  });
});
